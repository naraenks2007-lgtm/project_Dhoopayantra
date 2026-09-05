AROMAAI - MQTT -> FASTAPI -> WEBSOCKET DASHBOARD

Architecture:
    Cirkit / ESP32
          |
          | MQTT over WSS
          v
    broker.emqx.io:8084
          |
          v
       FastAPI
          |
          | WebSocket
          v
       Browser

MQTT topic:
    esp32/sensor_data

Backend WebSocket:
    ws://127.0.0.1:8000/ws/sensors

REST endpoint (still available):
    http://127.0.0.1:8000/api/sensor/latest

INSTALL:
    pip install fastapi uvicorn paho-mqtt

RUN:
    uvicorn main:app --reload

Then open:
    dashboard.html

IMPORTANT:
- The dashboard no longer polls the REST API.
- FastAPI receives MQTT messages and pushes them immediately
  to every connected WebSocket browser.
- REST remains available for normal API requests/history/etc.
- This uses broker.emqx.io for your current learning setup.
- For a production system, use your own authenticated broker.
