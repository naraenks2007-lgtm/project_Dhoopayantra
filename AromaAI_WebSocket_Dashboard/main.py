import json
import random
import ssl
import threading

import paho.mqtt.client as mqtt
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware


# ==========================================================
# FASTAPI
# ==========================================================

app = FastAPI(title="AromaAI Backend")


# Development CORS. Restrict this in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# EMQX MQTT CONFIGURATION
# ==========================================================

MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 8084
MQTT_TOPIC = "esp32/sensor_data"

CLIENT_ID = f"aromaai-fastapi-{random.randint(1000, 9999)}"


# ==========================================================
# LATEST SENSOR DATA
# ==========================================================

latest_sensor_data = {}

# Connected browser WebSocket clients
websocket_clients = set()


# ==========================================================
# MQTT -> WEBSOCKET
# ==========================================================

def broadcast_sensor_data(data: dict):
    """
    Send the newest MQTT sensor data to every connected browser.

    FastAPI's WebSocket send_text is async, while the Paho MQTT
    callback runs in a normal background thread. Therefore the
    actual async broadcast is scheduled on the FastAPI event loop.
    """
    import asyncio

    loop = broadcast_sensor_data.loop

    if loop is None:
        return

    payload = json.dumps(data)

    for websocket in list(websocket_clients):
        future = asyncio.run_coroutine_threadsafe(
            websocket.send_text(payload),
            loop
        )

        def done_callback(fut, ws=websocket):
            try:
                fut.result()
            except Exception:
                websocket_clients.discard(ws)

        future.add_done_callback(done_callback)


broadcast_sensor_data.loop = None


# ==========================================================
# MQTT CALLBACKS
# ==========================================================

def on_connect(client, userdata, flags, reason_code, properties=None):
    if reason_code == 0:
        print("✅ Connected to EMQX using secure WebSocket")
        client.subscribe(MQTT_TOPIC)
        print(f"✅ Subscribed to: {MQTT_TOPIC}")
    else:
        print("❌ MQTT connection failed:", reason_code)


def on_message(client, userdata, msg):
    global latest_sensor_data

    try:
        message = msg.payload.decode("utf-8")
        data = json.loads(message)

        if not isinstance(data, dict):
            print("❌ MQTT JSON must be an object")
            return

        latest_sensor_data = data

        print("\n📩 MQTT sensor data:")
        print(data)

        # Immediately push to connected browser clients.
        broadcast_sensor_data(data)

    except UnicodeDecodeError:
        print("❌ MQTT payload is not valid UTF-8")

    except json.JSONDecodeError:
        print("❌ MQTT message is not valid JSON")

    except Exception as e:
        print("❌ MQTT message error:", e)


# ==========================================================
# CREATE MQTT CLIENT
# ==========================================================

mqtt_client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id=CLIENT_ID,
    transport="websockets",
)

mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

# EMQX secure WebSocket endpoint
mqtt_client.ws_set_options(path="/mqtt")

# TLS
mqtt_client.tls_set(
    cert_reqs=ssl.CERT_REQUIRED
)

mqtt_client.tls_insecure_set(False)


# ==========================================================
# FASTAPI STARTUP
# ==========================================================

@app.on_event("startup")
async def startup_event():
    import asyncio

    # Save the running FastAPI event loop so MQTT's background thread
    # can schedule WebSocket sends safely.
    broadcast_sensor_data.loop = asyncio.get_running_loop()

    def start_mqtt():
        print("Connecting to EMQX...")
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_forever()

    threading.Thread(
        target=start_mqtt,
        daemon=True
    ).start()


# ==========================================================
# REST ENDPOINT
# ==========================================================

@app.get("/")
def home():
    return {
        "message": "AromaAI backend is running",
        "mqtt_topic": MQTT_TOPIC,
        "websocket": "/ws/sensors",
    }


@app.get("/api/sensor/latest")
def get_latest_sensor():
    return latest_sensor_data


# ==========================================================
# WEBSOCKET ENDPOINT
# ==========================================================

@app.websocket("/ws/sensors")
async def sensor_websocket(websocket: WebSocket):
    await websocket.accept()

    websocket_clients.add(websocket)

    print(
        f"🔌 WebSocket connected. "
        f"Clients: {len(websocket_clients)}"
    )

    try:
        # Send the current value immediately after connection.
        if latest_sensor_data:
            await websocket.send_text(
                json.dumps(latest_sensor_data)
            )

        # Keep connection alive.
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        pass

    except Exception as e:
        print("WebSocket error:", e)

    finally:
        websocket_clients.discard(websocket)

        print(
            f"🔌 WebSocket disconnected. "
            f"Clients: {len(websocket_clients)}"
        )
