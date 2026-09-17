import asyncio
from datetime import datetime
import json
import os
import random
import ssl
import threading
import time

import paho.mqtt.client as mqtt
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


# ==========================================================
# FASTAPI CONFIGURATION
# ==========================================================

app = FastAPI(title="AromaAI Backend & PWA")

# Enable CORS for local Vite development & PWA
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# MQTT CONFIGURATION
# ==========================================================

MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 8084
MQTT_TOPIC = "esp32/sensor_data"
CLIENT_ID = f"aromaai-fastapi-{random.randint(1000, 9999)}"

# Batch tracking
BATCH_ID = "AGB-2026-0902-001"
batch_start_dt = datetime.now()

# Sensor data state
latest_sensor_data = {}

mqtt_stats = {
    "broker": MQTT_BROKER,
    "topic": MQTT_TOPIC,
    "connected": False,
    "packet_count": 0,
    "last_received": None
}

# Connected browser WebSocket clients
websocket_clients = set()


# ==========================================================
# DRYING ESTIMATION & BRANCHES CALCULATION
# ==========================================================

def compute_drying_analytics(raw_data: dict) -> dict:
    """
    Process MQTT sensor data.

    Dashboard sensor data contains ONLY:
        1. temperature
        2. humidity

    Other incoming MQTT values are ignored.
    """

    now = datetime.now()

    # Read temperature and humidity
    temp = raw_data.get("temperature") or raw_data.get("temp")
    hum = raw_data.get("humidity") or raw_data.get("hum")

    # ------------------------------------------------------
    # Start time
    # ------------------------------------------------------

    start_time_str = batch_start_dt.strftime("%I:%M %p")

    elapsed_seconds = int(
        (now - batch_start_dt).total_seconds()
    )

    elapsed_hrs = elapsed_seconds // 3600
    elapsed_mins = (elapsed_seconds % 3600) // 60

    elapsed_str = (
        f"{elapsed_hrs}h {elapsed_mins}m"
        if elapsed_hrs > 0
        else f"{elapsed_mins}m"
    )

    # ------------------------------------------------------
    # Estimated completion
    # ------------------------------------------------------

    # Fixed value as requested
    estimated_time_str = "24 min"

    # ------------------------------------------------------
    # Progress and quality
    # ------------------------------------------------------

    if temp is not None and hum is not None:

        try:
            t = float(temp)
            h = float(hum)

            progress_calc = max(
                10,
                min(
                    98,
                    int(100 - (h - 25) * 1.8)
                )
            )

            quality_calc = max(
                75,
                min(
                    99,
                    int(
                        96
                        - abs(t - 39.5) * 2
                        - abs(h - 34) * 0.5
                    )
                )
            )

        except (ValueError, TypeError):

            progress_calc = 82
            quality_calc = 91

    else:

        progress_calc = 82
        quality_calc = 91

    # ------------------------------------------------------
    # Branches dried
    # ------------------------------------------------------

    branches_day = 360
    branches_week = 2240
    branches_month = 9600

    # ------------------------------------------------------
    # IMPORTANT:
    # Only temperature and humidity are taken from MQTT.
    # ------------------------------------------------------

    enriched = {
        "temperature": temp,
        "humidity": hum,

        "batchId": BATCH_ID,

        "startTime": start_time_str,

        "elapsedTime": elapsed_str,

        "estimatedTime": estimated_time_str,

        "progress": progress_calc,

        "qualityScore": quality_calc,

        "branches_dried": {
            "day": branches_day,
            "week": branches_week,
            "month": branches_month
        },

        "batches_dried": {
            "day": 18,
            "week": 112,
            "month": 480
        },

        "mqtt_metadata": {
            "topic": MQTT_TOPIC,
            "broker": MQTT_BROKER,
            "packet_num": mqtt_stats["packet_count"],
            "received_at": now.strftime("%H:%M:%S")
        }
    }

    return enriched


# ==========================================================
# BROADCAST FUNCTION
# ==========================================================

def broadcast_sensor_data(data: dict):
    """
    Send newest enriched MQTT data to every connected
    browser WebSocket.
    """

    loop = broadcast_sensor_data.loop

    if loop is None or loop.is_closed():
        return

    payload = json.dumps(data)

    for ws in list(websocket_clients):

        future = asyncio.run_coroutine_threadsafe(
            ws.send_text(payload),
            loop
        )

        def done_cb(fut, client_ws=ws):

            try:
                fut.result()

            except Exception:
                websocket_clients.discard(client_ws)

        future.add_done_callback(done_cb)


broadcast_sensor_data.loop = None


# ==========================================================
# MQTT CALLBACKS
# ==========================================================

def on_connect(
    client,
    userdata,
    flags,
    reason_code,
    properties=None
):

    if reason_code == 0:

        mqtt_stats["connected"] = True

        print(
            f"✅ Connected to EMQX "
            f"({MQTT_BROKER}:{MQTT_PORT}) "
            f"via secure WebSocket"
        )

        client.subscribe(MQTT_TOPIC)

        print(
            f"✅ Subscribed to MQTT Topic: "
            f"{MQTT_TOPIC}"
        )

    else:

        mqtt_stats["connected"] = False

        print(
            "❌ MQTT connection failed "
            "with reason code:",
            reason_code
        )


def on_message(client, userdata, msg):

    global latest_sensor_data, mqtt_stats

    try:

        raw_payload = msg.payload.decode("utf-8")

        data = json.loads(raw_payload)

        if not isinstance(data, dict):

            print(
                "⚠️ MQTT message is not "
                "a JSON object:",
                raw_payload
            )

            return

        mqtt_stats["packet_count"] += 1

        mqtt_stats["last_received"] = (
            datetime.now().strftime("%H:%M:%S")
        )

        print(
            f"\n📩 [MQTT #{mqtt_stats['packet_count']}] "
            f"Received on '{msg.topic}':"
        )

        print(
            json.dumps(
                data,
                indent=2
            )
        )

        # --------------------------------------------------
        # Only temperature + humidity are processed.
        # ON/OFF, distance, pot, etc. are ignored.
        # --------------------------------------------------

        sensor_data = {
            "temperature": data.get("temperature"),
            "humidity": data.get("humidity")
        }

        # Enrich data for dashboard
        latest_sensor_data = compute_drying_analytics(
            sensor_data
        )

        # Broadcast live data to React dashboard
        broadcast_sensor_data(
            latest_sensor_data
        )

    except json.JSONDecodeError:

        print(
            "❌ Invalid JSON in MQTT payload:",
            msg.payload
        )

    except Exception as e:

        print(
            "❌ Error processing MQTT message:",
            e
        )


# ==========================================================
# MQTT CLIENT INITIALIZATION
# ==========================================================

mqtt_client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id=CLIENT_ID,
    transport="websockets",
)

mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

mqtt_client.ws_set_options(
    path="/mqtt"
)

mqtt_client.tls_set(
    cert_reqs=ssl.CERT_REQUIRED
)

mqtt_client.tls_insecure_set(False)


# ==========================================================
# FASTAPI STARTUP
# ==========================================================

@app.on_event("startup")
async def startup_event():

    broadcast_sensor_data.loop = (
        asyncio.get_running_loop()
    )

    def start_mqtt():

        print(
            f"Connecting to EMQX MQTT Broker "
            f"{MQTT_BROKER}:{MQTT_PORT}..."
        )

        try:

            mqtt_client.connect(
                MQTT_BROKER,
                MQTT_PORT,
                60
            )

            mqtt_client.loop_forever()

        except Exception as err:

            print(
                "MQTT connection loop error:",
                err
            )

    threading.Thread(
        target=start_mqtt,
        daemon=True
    ).start()


# ==========================================================
# REST API ENDPOINTS
# ==========================================================

@app.get("/api/health")
def health_check():

    return {
        "status": "online",

        "service":
            "AromaAI Backend & Telemetry Server",

        "mqtt_status":
            mqtt_stats,

        "active_websockets":
            len(websocket_clients),

        "has_live_data":
            bool(latest_sensor_data)
    }


@app.get("/api/sensor/latest")
def get_latest_sensor():

    """
    Returns latest sensor data enriched from MQTT.
    """

    if not latest_sensor_data:

        return {
            "status":
                "waiting_for_mqtt",

            "message":
                f"Listening to MQTT topic "
                f"'{MQTT_TOPIC}' on "
                f"{MQTT_BROKER}...",

            "mqtt_stats":
                mqtt_stats
        }

    return latest_sensor_data


# ==========================================================
# MQTT SAMPLE PUBLISH
# ==========================================================

@app.post("/api/mqtt/publish-sample")
@app.get("/api/mqtt/publish-sample")
def publish_sample_mqtt():

    """
    Publish a sample payload containing ONLY:

        temperature
        humidity

    """

    sample_payload = {

        "temperature":
            round(
                random.uniform(
                    38.2,
                    41.5
                ),
                1
            ),

        "humidity":
            round(
                random.uniform(
                    32.0,
                    36.5
                ),
                1
            )
    }

    payload_str = json.dumps(
        sample_payload
    )

    info = mqtt_client.publish(
        MQTT_TOPIC,
        payload_str,
        qos=1
    )

    info.wait_for_publish(
        timeout=3
    )

    return {

        "success":
            True,

        "published_to":
            MQTT_TOPIC,

        "broker":
            MQTT_BROKER,

        "payload":
            sample_payload
    }


# ==========================================================
# WEBSOCKET ENDPOINT
# ==========================================================

@app.websocket("/ws/sensors")
async def sensor_websocket(
    websocket: WebSocket
):

    await websocket.accept()

    websocket_clients.add(
        websocket
    )

    print(
        f"🔌 React Dashboard connected "
        f"via WebSocket. Total clients: "
        f"{len(websocket_clients)}"
    )

    try:

        # --------------------------------------------------
        # Send existing live data immediately
        # --------------------------------------------------

        if latest_sensor_data:

            await websocket.send_text(
                json.dumps(
                    latest_sensor_data
                )
            )

        else:

            await websocket.send_text(
                json.dumps({

                    "status":
                        "connected_awaiting_mqtt",

                    "message":
                        f"Connected to backend. "
                        f"Waiting for MQTT messages "
                        f"on '{MQTT_TOPIC}'...",

                    "mqtt_broker":
                        MQTT_BROKER,

                    "mqtt_topic":
                        MQTT_TOPIC,

                    "batchId":
                        BATCH_ID,

                    "startTime":
                        batch_start_dt.strftime(
                            "%I:%M %p"
                        )
                })
            )

        # --------------------------------------------------
        # Keep WebSocket alive
        # --------------------------------------------------

        while True:

            msg = await websocket.receive_text()

            try:

                msg_data = json.loads(msg)

                if (
                    isinstance(msg_data, dict)
                    and
                    msg_data.get("action")
                    == "publish_sample"
                ):

                    publish_sample_mqtt()

            except Exception:
                pass

            if msg == "ping":

                await websocket.send_text(
                    json.dumps({
                        "type": "pong"
                    })
                )

    except WebSocketDisconnect:

        pass

    except Exception as e:

        print(
            "WebSocket client error:",
            e
        )

    finally:

        websocket_clients.discard(
            websocket
        )

        print(
            f"🔌 React Dashboard disconnected. "
            f"Remaining clients: "
            f"{len(websocket_clients)}"
        )


# ==========================================================
# STATIC FILES & PWA SERVING
# ==========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

FRONTEND_DIST = os.path.join(
    BASE_DIR,
    "frontend",
    "dist"
)


if os.path.exists(FRONTEND_DIST):

    app.mount(
        "/assets",
        StaticFiles(
            directory=os.path.join(
                FRONTEND_DIST,
                "assets"
            )
        ),
        name="assets"
    )

    @app.get("/{full_path:path}")
    async def serve_pwa(
        full_path: str
    ):

        file_path = os.path.join(
            FRONTEND_DIST,
            full_path
        )

        if (
            full_path
            and os.path.exists(file_path)
            and os.path.isfile(file_path)
        ):

            return FileResponse(
                file_path
            )

        return FileResponse(
            os.path.join(
                FRONTEND_DIST,
                "index.html"
            )
        )

else:

    @app.get("/")
    def home_fallback():

        return {

            "message":
                "AromaAI backend is running. "
                "Build the frontend "
                "(`npm run build`) to serve "
                "the PWA.",

            "api_sensor":
                "/api/sensor/latest",

            "websocket":
                "/ws/sensors"
        }


# ==========================================================
# RUN SERVER
# ==========================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )