import json
import random
import threading

from fastapi import FastAPI
from paho.mqtt import client as mqtt


# ==========================================================
# FASTAPI
# ==========================================================

app = FastAPI(title="AromaAI Backend")


# ==========================================================
# MQTT CONFIGURATION
# ==========================================================

BROKER = "broker.emqx.io"
PORT = 8084
TOPIC = "esp32/sensor_data"

CLIENT_ID = f"aromaai-fastapi-{random.randint(1000, 9999)}"


# ==========================================================
# LATEST SENSOR DATA
# ==========================================================

latest_sensor_data = {}


# ==========================================================
# MQTT CONNECT
# ==========================================================

def on_connect(client, userdata, flags, reason_code, properties=None):

    if reason_code == 0:
        print("✅ FastAPI MQTT client connected to EMQX")

        client.subscribe(TOPIC)

        print(f"✅ Subscribed to: {TOPIC}")

    else:
        print("❌ MQTT connection failed:", reason_code)


# ==========================================================
# MQTT MESSAGE
# ==========================================================

def on_message(client, userdata, msg):

    global latest_sensor_data

    try:

        message = msg.payload.decode("utf-8")

        data = json.loads(message)

        latest_sensor_data = data

        print("\n📩 New sensor data:")
        print(data)

    except json.JSONDecodeError:

        print("❌ Invalid JSON received")

    except Exception as e:

        print("❌ Error:", e)


# ==========================================================
# CREATE MQTT CLIENT
# ==========================================================

mqtt_client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id=CLIENT_ID,
    transport="websockets"
)

mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

# Secure WebSocket
mqtt_client.ws_set_options(path="/mqtt")

# TLS
mqtt_client.tls_set()


# ==========================================================
# CONNECT MQTT
# ==========================================================

mqtt_client.connect(
    BROKER,
    PORT,
    60
)


# Start MQTT background loop
mqtt_client.loop_start()


# ==========================================================
# FASTAPI ROUTES
# ==========================================================

@app.get("/")
def home():

    return {
        "message": "AromaAI backend is running"
    }


@app.get("/api/sensor/latest")
def get_latest_sensor():

    return latest_sensor_data