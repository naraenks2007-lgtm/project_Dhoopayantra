AromaAI 3-Sensor WebSocket Demo

This dashboard uses the exact settings from the uploaded main.py:
MQTT broker: broker.emqx.io
MQTT port: 8084
MQTT topic: esp32/sensor_data
FastAPI WebSocket: /ws/sensors

Displays only:
- temperature
- humidity
- distance_cm

Run:
    uvicorn main:app --host 0.0.0.0 --port 8000

Then serve this folder:
    python -m http.server 5500

Open:
    http://127.0.0.1:5500/

For another device on the same LAN:
    http://YOUR_LAPTOP_IP:5500/

The dashboard connects to:
    ws://YOUR_LAPTOP_IP:8000/ws/sensors

The browser does NOT connect directly to MQTT.
FastAPI receives MQTT data and broadcasts it through WebSocket.
