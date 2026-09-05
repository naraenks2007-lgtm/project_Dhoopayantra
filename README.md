# 🌿 AromaAI – Smart Drying & Live Telemetry PWA

AI-powered IoT smart drying platform for rural women artisans manufacturing agarbatti (incense sticks), featuring real-time WebSocket telemetry, AI moisture & quality predictions, smart packaging guidance, and livelihood analytics.

---

## 🎨 Design & Theme Specs (Matching Provided Mockup)
- **Primary Color:** `#1E5E3A` (Deep Herbal Forest Green)
- **Secondary Green:** `#27AE60` / `#16834D`
- **Accent Terracotta/Orange:** `#E07A5F` / `#E67E22`
- **Background:** `#FAF7F2` (Warm Soft Cream)
- **Typography:** `Poppins` (Semibold, Medium, Regular)
- **App Feel:** Natural, Trustworthy, Clean, Simple, Empowering

---

## 📱 Features & 5 Mandatory Dashboard Metrics
1. **Temperature (°C):** Live WebSocket sensor feed with optimal drying thresholds (38°C – 42°C) and real-time sparkline graph.
2. **Humidity (% RH):** Live chamber humidity feed with controlled threshold badges.
3. **Number of Branches Dried (1 Day, 1 Week, 1 Month):**
   - Interactive toggle between **1 Day** (360 branches / 18 batches), **1 Week** (2,240 branches / 112 batches), and **1 Month** (9,600 branches / 480 batches).
   - Production trend bar charts and productivity growth analytics.
4. **Estimated Time to Complete:** Live countdown and AI prediction (e.g., `24 min ± 4 min`).
5. **Start Time:** Batch start time (e.g., `08:30 AM`) and elapsed drying duration (`1h 14m`).

### Additional Screen Features Included:
- **Screen 1 (Home Dashboard):** Greeting, artisan profile, batch status banner, dual circular gauges for drying progress and AI quality prediction.
- **Screen 2 (Drying Monitor):** Live trend curves for Temperature, Humidity, Weight loss, Chamber distance, and Potentiometer voltage.
- **Screen 3 & 4 (AI Predictions & CV Tray Inspection):** Moisture level (8.7%), Fragrance protection (98.2%), Breakage risk (3.2%), and 9-tray visual inspection grid.
- **Screen 5 (Alerts):** High/low temperature, power status, and drying notifications.
- **Screen 7 (Smart Packaging):** 20 sticks per pouch packaging instructions with interactive sealing action button.
- **Screen 8 (SHG / Admin Analytics):** Livelihood metrics, batch traceability, solar energy saved (1.8 kWh).

---

## 🚀 How to Run

### Option 1: Fast Single-Server Run (FastAPI hosts both WebSocket & React PWA)
Run the root FastAPI backend:
```bash
python main.py
# Or with uvicorn:
uvicorn main:app --reload --port 8000
```
Open in browser:
👉 **`http://127.0.0.1:8000/`**

FastAPI automatically serves the built React PWA, connects to EMQX MQTT broker over WSS, and streams live telemetry to the browser via WebSocket at `ws://127.0.0.1:8000/ws/sensors`.

---

### Option 2: Live Frontend Development (Vite Dev Server)
1. Start the FastAPI backend:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
2. Start the Vite React development server:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open:
   👉 **`http://localhost:3000/`**

---

## 📲 PWA Installation (Mobile & Desktop)
- **On Mobile (Chrome/Edge/Safari):** Tap the "Install AromaAI" banner or select "Add to Home Screen" from browser menu. The app installs as a native, standalone, full-screen mobile app with offline caching via `sw.js`.
- **On Desktop:** Click the "Install" button in the address bar, or use the top right "Expanded View / Mobile View" toggle button to preview in a mobile device shell or wide desktop dashboard.
- **Simulation Mode:** Click the "Simulate IoT" button in the header bar anytime to test real-time changing temperatures and humidities even if the physical ESP32 device is offline.
