import asyncio
import json
import os
import random
import ssl
import threading

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

latest_sensor_data = {
    "temperature": 39.4,
    "humidity": 34.0,
    "distance_cm": 14.5,
    "pot_raw": 2840,
    "pot_volts": 2.45,
    "weight": 433,
    "solarPower": 72,
    "battery": 68,
    "airflow": "Good",
    "progress": 82,
    "qualityScore": 91,
    "startTime": "08:30 AM",
    "elapsedTime": "1h 14m",
    "estimatedTime": "24 min ± 4 min",
    "batchId": "AGB-2026-0902-001"
}

# Set of active browser WebSocket connections
websocket_clients = set()


# ==========================================================
# BROADCAST FUNCTION
# ==========================================================

def broadcast_sensor_data(data: dict):
    """
    Push newest sensor data to all connected browser WebSockets.
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

def on_connect(client, userdata, flags, reason_code, properties=None):
    if reason_code == 0:
        print("✅ Connected to EMQX via secure WebSocket")
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
            return

        latest_sensor_data.update(data)
        print("\n📩 New MQTT Sensor Data received:")
        print(data)

        # Broadcast immediately to React PWA clients
        broadcast_sensor_data(latest_sensor_data)

    except Exception as e:
        print("MQTT processing error:", e)


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
mqtt_client.ws_set_options(path="/mqtt")
mqtt_client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
mqtt_client.tls_insecure_set(False)


# ==========================================================
# FASTAPI STARTUP
# ==========================================================

@app.on_event("startup")
async def startup_event():
    broadcast_sensor_data.loop = asyncio.get_running_loop()

    def start_mqtt():
        print(f"Connecting to MQTT Broker {MQTT_BROKER}:{MQTT_PORT}...")
        try:
            mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
            mqtt_client.loop_forever()
        except Exception as err:
            print("MQTT connect warning:", err)

    threading.Thread(target=start_mqtt, daemon=True).start()


# ==========================================================
# API ENDPOINTS
# ==========================================================

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "AromaAI Backend & PWA Server",
        "mqtt_topic": MQTT_TOPIC,
        "websocket": "/ws/sensors",
        "connected_ws_clients": len(websocket_clients)
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
    print(f"🔌 Browser WebSocket connected. Total clients: {len(websocket_clients)}")

    try:
        # Immediately send current state
        if latest_sensor_data:
            await websocket.send_text(json.dumps(latest_sensor_data))

        while True:
            # Keep-alive receive
            await websocket.receive_text()

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print("WebSocket client error:", e)
    finally:
        websocket_clients.discard(websocket)
        print(f"🔌 Browser WebSocket disconnected. Remaining: {len(websocket_clients)}")


# ==========================================================
# STATIC FILES & PWA SERVING
# ==========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")

if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_pwa(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    def home_fallback():
        return {
            "message": "AromaAI backend is running. Build the frontend (`npm run build`) to serve the PWA.",
            "api_sensor": "/api/sensor/latest",
            "websocket": "/ws/sensors"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)