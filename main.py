import asyncio
import json
import random
import ssl
import threading

from contextlib import asynccontextmanager

import paho.mqtt.client as mqtt
from fastapi import FastAPI, WebSocket, WebSocketDisconnect


# ==========================================================
# MQTT CONFIGURATION
# ==========================================================

MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 8883
MQTT_TOPIC = "esp32/sensor_data"

CLIENT_ID = f"aromaai-fastapi-{random.randint(1000, 9999)}"


# ==========================================================
# GLOBAL DATA
# ==========================================================

latest_sensor_data = {}

websocket_clients = set()

main_loop = None


# ==========================================================
# MQTT CONNECT CALLBACK
# ==========================================================

def on_connect(client, userdata, flags, reason_code, properties=None):

    if reason_code == 0:

        print("✅ Connected to EMQX")
        print(f"📡 Broker : {MQTT_BROKER}:{MQTT_PORT}")
        print(f"📌 Topic  : {MQTT_TOPIC}")

        client.subscribe(MQTT_TOPIC)

        print("✅ MQTT subscription successful")

    else:

        print("❌ MQTT connection failed")
        print("Reason code:", reason_code)


# ==========================================================
# MQTT MESSAGE CALLBACK
# ==========================================================

def on_message(client, userdata, msg):

    global latest_sensor_data

    try:

        # MQTT bytes → string
        payload = msg.payload.decode("utf-8")

        print("\n📩 MQTT message:")
        print(payload)

        # JSON string → Python dictionary
        data = json.loads(payload)

        if not isinstance(data, dict):

            print("❌ Invalid JSON object")
            return

        # --------------------------------------------------
        # KEEP ONLY TWO SENSOR VALUES
        # --------------------------------------------------

        latest_sensor_data = {

            "distance_cm": data.get("distance_cm"),

            "infrared": data.get("infrared")

        }

        print("✅ Processed data:")
        print(latest_sensor_data)

        # --------------------------------------------------
        # SEND DATA TO ALL CONNECTED BROWSERS
        # --------------------------------------------------

        if main_loop is None:
            return

        message = json.dumps(latest_sensor_data)

        for websocket in list(websocket_clients):

            try:

                future = asyncio.run_coroutine_threadsafe(

                    websocket.send_text(message),

                    main_loop

                )

                # Retrieve async exceptions
                future.add_done_callback(
                    lambda f: f.exception()
                )

            except Exception as error:

                print(
                    "❌ WebSocket broadcast error:",
                    error
                )

                websocket_clients.discard(websocket)


    except json.JSONDecodeError:

        print("❌ MQTT payload is not valid JSON")

    except UnicodeDecodeError:

        print("❌ MQTT payload is not UTF-8")

    except Exception as error:

        print("❌ Error processing MQTT message:")
        print(error)


# ==========================================================
# MQTT CLIENT
# ==========================================================

mqtt_client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id=CLIENT_ID
)

mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message


# ==========================================================
# TLS / SSL
# ==========================================================

mqtt_client.tls_set(
    cert_reqs=ssl.CERT_REQUIRED
)

mqtt_client.tls_insecure_set(False)


# ==========================================================
# MQTT THREAD
# ==========================================================

def mqtt_thread():

    try:

        print("\n🔄 Connecting to EMQX...")

        mqtt_client.connect(
            MQTT_BROKER,
            MQTT_PORT,
            60
        )

        mqtt_client.loop_forever()

    except Exception as error:

        print("\n❌ MQTT error:")
        print(error)


# ==========================================================
# FASTAPI LIFESPAN
# ==========================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    global main_loop

    # Get FastAPI asyncio event loop
    main_loop = asyncio.get_running_loop()

    print("\n======================================")
    print("       AromaAI Backend Started")
    print("======================================")

    # Start MQTT in background
    threading.Thread(
        target=mqtt_thread,
        daemon=True
    ).start()

    yield

    # ------------------------------------------------------
    # SHUTDOWN
    # ------------------------------------------------------

    print("\n🛑 Shutting down...")

    try:

        mqtt_client.disconnect()

        print("✅ MQTT disconnected")

    except Exception as error:

        print("⚠️ MQTT disconnect error:", error)


# ==========================================================
# FASTAPI APPLICATION
# ==========================================================

app = FastAPI(
    title="AromaAI Sensor Backend",
    lifespan=lifespan
)


# ==========================================================
# HOME
# ==========================================================

@app.get("/")
async def home():

    return {

        "message": "AromaAI backend is running",

        "mqtt_broker": MQTT_BROKER,

        "mqtt_port": MQTT_PORT,

        "mqtt_topic": MQTT_TOPIC,

        "websocket": "/ws/sensors"

    }


# ==========================================================
# REST API - LATEST DATA
# ==========================================================

@app.get("/api/sensor/latest")
async def get_latest_sensor():

    if not latest_sensor_data:

        return {

            "status": "waiting_for_data"

        }

    return latest_sensor_data


# ==========================================================
# WEBSOCKET
# ==========================================================

@app.websocket("/ws/sensors")
async def sensor_websocket(websocket: WebSocket):

    await websocket.accept()

    websocket_clients.add(websocket)

    print(
        f"\n🔌 Dashboard connected"
        f" | Clients: {len(websocket_clients)}"
    )

    try:

        # Send current data immediately
        if latest_sensor_data:

            await websocket.send_text(
                json.dumps(latest_sensor_data)
            )

        else:

            await websocket.send_text(
                json.dumps({
                    "status": "waiting_for_data"
                })
            )

        # Keep the connection alive
        while True:

            message = await websocket.receive_text()

            # Optional heartbeat
            if message == "ping":

                await websocket.send_text(
                    json.dumps({
                        "type": "pong"
                    })
                )

    except WebSocketDisconnect:

        print("🔌 Dashboard disconnected")

    except Exception as error:

        print("❌ WebSocket error:")
        print(error)

    finally:

        websocket_clients.discard(websocket)

        print(
            f"🔌 Remaining clients: "
            f"{len(websocket_clients)}"
        )


# ==========================================================
# RUN DIRECTLY
# ==========================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )