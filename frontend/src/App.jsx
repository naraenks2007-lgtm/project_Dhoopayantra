import React, { useState, useEffect, useRef } from 'react';
import HomeDashboard from './components/HomeDashboard';
import DryingMonitor from './components/DryingMonitor';
import AIPredictions from './components/AIPredictions';
import BatchAnalytics from './components/BatchAnalytics';
import AlertsPackaging from './components/AlertsPackaging';
import Navbar from './components/Navbar';
import { 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Monitor, 
  Play, 
  Pause, 
  Download,
  Sparkles,
  Signal,
  BatteryCharging,
  Send
} from 'lucide-react';

export default function App() {
  // Navigation screen
  const [activeScreen, setActiveScreen] = useState('home');

  // Display mode for desktop: mobile phone frame vs full width
  const [isExpanded, setIsExpanded] = useState(false);

  // Simulation mode (for demo/offline testing)
  const [isSimulating, setIsSimulating] = useState(false);

  // Period filter for branches dried (day / week / month)
  const [period, setPeriod] = useState('day');

  // WebSocket connection status
  const [wsStatus, setWsStatus] = useState('connecting'); // 'online' | 'connecting' | 'offline'

  // Live MQTT tracking state
  const [hasLiveMqtt, setHasLiveMqtt] = useState(false);
  const [mqttPacketCount, setMqttPacketCount] = useState(0);
  const [lastMqttTime, setLastMqttTime] = useState(null);
  const [rawMqtt, setRawMqtt] = useState(null);

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Live sensor telemetry (starts without dummy data until MQTT arrives or sim is clicked)
  const [sensorData, setSensorData] = useState({
    temperature: null,
    humidity: null,
    distance_cm: null,
    pot_raw: null,
    pot_volts: null,
    weight: 433,
    solarPower: 72,
    battery: 68,
    airflow: 'Good',
    progress: 82,
    qualityScore: 91,
    startTime: '08:30 AM',
    elapsedTime: '1h 14m',
    estimatedTime: '24 min ± 4 min',
    batchId: 'AGB-2026-0902-001'
  });

  // Rolling history for sparkline charts
  const [historyData, setHistoryData] = useState({
    temperature: [38.2, 38.5, 38.9, 39.1, 39.4, 39.5, 39.3, 39.4, 39.6, 39.4],
    humidity: [45.0, 42.5, 40.0, 38.2, 36.5, 35.8, 35.0, 34.5, 34.2, 34.0],
    weight: [495, 485, 472, 460, 451, 444, 439, 436, 434, 433]
  });

  // Branch statistics for Day, Week, and Month (User Requirement #3)
  const [batchStats, setBatchStats] = useState({
    day: {
      label: 'Today',
      branches: 360,
      batches: 18,
      growth: 12,
      history: [
        { label: '9AM', branches: 60, percentage: 40 },
        { label: '11AM', branches: 80, percentage: 65 },
        { label: '1PM', branches: 100, percentage: 80 },
        { label: '3PM', branches: 70, percentage: 55 },
        { label: 'Now', branches: 50, percentage: 95 }
      ]
    },
    week: {
      label: 'Past 7 Days',
      branches: 2240,
      batches: 112,
      growth: 18,
      history: [
        { label: 'Mon', branches: 320, percentage: 70 },
        { label: 'Tue', branches: 340, percentage: 75 },
        { label: 'Wed', branches: 300, percentage: 65 },
        { label: 'Thu', branches: 360, percentage: 80 },
        { label: 'Fri', branches: 380, percentage: 85 },
        { label: 'Sat', branches: 280, percentage: 60 },
        { label: 'Sun', branches: 260, percentage: 55 }
      ]
    },
    month: {
      label: 'This Month',
      branches: 9600,
      batches: 480,
      growth: 24,
      history: [
        { label: 'W1', branches: 2100, percentage: 65 },
        { label: 'W2', branches: 2350, percentage: 75 },
        { label: 'W3', branches: 2500, percentage: 80 },
        { label: 'W4', branches: 2650, percentage: 90 }
      ]
    }
  });

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // 1. Listen for PWA install event
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  // 2. Connect to FastAPI WebSocket (/ws/sensors)
  useEffect(() => {
    if (isSimulating) {
      if (socketRef.current) socketRef.current.close();
      setWsStatus('online');
      return;
    }

    let isSubscribed = true;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || '127.0.0.1';
      const wsUrl = `${protocol}//${host}:8000/ws/sensors`;

      setWsStatus('connecting');

      try {
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          if (!isSubscribed) return;
          console.log('✅ WebSocket Connected to AromaAI Backend');
          setWsStatus('online');
        };

        socket.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const data = JSON.parse(event.data);
            console.log('📩 Incoming Sensor Data from main.py:', data);

            // If backend is still waiting for first MQTT message
            if (data.status === 'connected_awaiting_mqtt') {
              setRawMqtt(data);
              return;
            }

            // Real MQTT data received!
            const tempVal = data.temperature !== undefined ? parseFloat(data.temperature) : null;
            const humVal = data.humidity !== undefined ? parseFloat(data.humidity) : null;

            if (tempVal !== null || humVal !== null) {
              setHasLiveMqtt(true);
              setMqttPacketCount((c) => c + 1);
              setLastMqttTime(new Date().toLocaleTimeString());
              setRawMqtt(data);

              setSensorData((prev) => {
                const updatedTemp = tempVal !== null ? tempVal : prev.temperature;
                const updatedHum = humVal !== null ? humVal : prev.humidity;

                // Update history sparklines
                setHistoryData((h) => ({
                  temperature: [...h.temperature.slice(1), updatedTemp],
                  humidity: [...h.humidity.slice(1), updatedHum],
                  weight: [...h.weight.slice(1), prev.weight]
                }));

                return {
                  ...prev,
                  ...data,
                  temperature: updatedTemp,
                  humidity: updatedHum
                };
              });

              // Update branch stats if provided by main.py
              if (data.branches_dried) {
                setBatchStats((b) => ({
                  ...b,
                  day: { ...b.day, branches: data.branches_dried.day },
                  week: { ...b.week, branches: data.branches_dried.week },
                  month: { ...b.month, branches: data.branches_dried.month }
                }));
              }
            }
          } catch (err) {
            console.error('Error parsing WS JSON:', err);
          }
        };

        socket.onerror = (err) => {
          console.warn('WebSocket error, will auto-reconnect...', err);
          if (isSubscribed) setWsStatus('offline');
        };

        socket.onclose = () => {
          if (!isSubscribed) return;
          console.log('WebSocket closed. Retrying in 3s...');
          setWsStatus('offline');
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };
      } catch (err) {
        console.error('WebSocket connection error:', err);
        if (isSubscribed) {
          setWsStatus('offline');
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        }
      }
    };

    connectWebSocket();

    return () => {
      isSubscribed = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [isSimulating]);

  // 3. Publish Test MQTT Packet to EMQX broker to verify live flow
  const handlePublishTestPacket = async () => {
    const host = window.location.hostname || '127.0.0.1';
    try {
      const res = await fetch(`http://${host}:8000/api/mqtt/publish-sample`, {
        method: 'POST'
      });
      const result = await res.json();
      console.log('⚡ Published test sample to EMQX:', result);
    } catch (err) {
      console.warn('Could not trigger backend test publish:', err);
      // Fallback local simulation injection
      const sample = {
        temperature: parseFloat((38.5 + Math.random() * 2.5).toFixed(1)),
        humidity: parseFloat((33.0 + Math.random() * 3.0).toFixed(1)),
        distance_cm: parseFloat((14.0 + Math.random() * 1.2).toFixed(1)),
        pot_raw: Math.floor(2700 + Math.random() * 200),
        pot_volts: parseFloat((2.35 + Math.random() * 0.15).toFixed(2)),
        device: "ESP32_SIMULATOR"
      };
      setHasLiveMqtt(true);
      setMqttPacketCount(c => c + 1);
      setLastMqttTime(new Date().toLocaleTimeString());
      setRawMqtt(sample);
      setSensorData(prev => ({ ...prev, ...sample }));
    }
  };

  // 4. Simulator loop when explicitly turned on
  useEffect(() => {
    if (!isSimulating) return;

    setHasLiveMqtt(true);
    const interval = setInterval(() => {
      setSensorData((prev) => {
        const curTemp = prev.temperature || 39.4;
        const curHum = prev.humidity || 34.0;
        const dTemp = (Math.random() - 0.5) * 0.4;
        const dHum = (Math.random() - 0.5) * 0.5;
        const newTemp = parseFloat((Math.max(38.0, Math.min(41.5, curTemp + dTemp))).toFixed(1));
        const newHum = parseFloat((Math.max(31.0, Math.min(36.5, curHum + dHum))).toFixed(1));
        const newDist = parseFloat((14.0 + Math.random() * 0.8).toFixed(1));
        const newPotVolts = parseFloat((2.4 + Math.random() * 0.1).toFixed(2));
        const newPotRaw = Math.floor(2800 + Math.random() * 80);

        setMqttPacketCount(c => c + 1);
        setLastMqttTime(new Date().toLocaleTimeString());
        setRawMqtt({
          temperature: newTemp,
          humidity: newHum,
          distance_cm: newDist,
          pot_raw: newPotRaw,
          pot_volts: newPotVolts,
          device: "ESP32_DRYER_001",
          simulated: true
        });

        // Update history
        setHistoryData((h) => ({
          temperature: [...h.temperature.slice(1), newTemp],
          humidity: [...h.humidity.slice(1), newHum],
          weight: [...h.weight.slice(1), prev.weight]
        }));

        return {
          ...prev,
          temperature: newTemp,
          humidity: newHum,
          distance_cm: newDist,
          pot_raw: newPotRaw,
          pot_volts: newPotVolts
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="app-viewport">
      {/* Top Controls on Desktop: Mode Switch & Simulator Toggle */}
      <header className={`top-bar-controls ${isExpanded ? 'expanded-mode' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: '700', color: 'var(--primary)', letterSpacing: '0.5px' }}>
            🌿 AromaAI
          </span>
          <span style={{ fontSize: '11px', color: '#828f87' }}>PWA v1.0</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Simulator Toggle */}
          <button
            className={`sim-toggle-btn ${isSimulating ? 'active' : ''}`}
            onClick={() => setIsSimulating(!isSimulating)}
            title="Toggle simulated IoT data generator"
          >
            {isSimulating ? <Pause size={13} /> : <Play size={13} />}
            <span>{isSimulating ? 'Simulating' : 'Simulate IoT'}</span>
          </button>

          {/* Desktop Frame Mode Switch */}
          <button
            className="mode-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title="Toggle between Mobile Phone Frame and Full Width"
          >
            {isExpanded ? <Smartphone size={14} /> : <Monitor size={14} />}
            <span>{isExpanded ? 'Mobile View' : 'Expanded View'}</span>
          </button>
        </div>
      </header>

      {/* Main Container Shell (matches mobile frame from template image) */}
      <div className={`device-shell ${isExpanded ? 'expanded' : ''}`}>
        {/* Dynamic Island / Notch on Phone Frame */}
        {!isExpanded && (
          <div className="device-notch">
            <div className="device-notch-sensor"></div>
            <div className="device-notch-camera"></div>
          </div>
        )}

        {/* System Bar (Time, Telemetry Status, Battery) */}
        <div className="system-status-bar">
          <span>09:44 AM</span>

          {/* WebSocket Status Indicator */}
          <div className="system-status-icons">
            <span className={`ws-status-pill ${wsStatus === 'online' ? 'online' : 'offline'}`}>
              {wsStatus === 'online' ? (
                <>
                  <Wifi size={12} />
                  <span>{hasLiveMqtt ? 'Live MQTT' : 'Backend Connected'}</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} />
                  <span>Backend Offline</span>
                </>
              )}
            </span>
            <BatteryCharging size={15} color="var(--primary)" />
          </div>
        </div>

        {/* Scrollable Content Container */}
        <main className="main-scroll-content">
          {/* PWA Installation Prompt Banner */}
          {showInstallBanner && (
            <div className="pwa-install-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={14} />
                <span>Install AromaAI App to your Home Screen</span>
              </div>
              <button onClick={handleInstallPWA}>Install</button>
            </div>
          )}

          {/* Screen 1: Home Live Tracking Dashboard */}
          {activeScreen === 'home' && (
            <HomeDashboard
              sensorData={sensorData}
              period={period}
              setPeriod={setPeriod}
              batchStats={batchStats}
              rawMqtt={rawMqtt}
              mqttPacketCount={mqttPacketCount}
              lastMqttTime={lastMqttTime}
              hasLiveMqtt={hasLiveMqtt}
              onPublishTestPacket={handlePublishTestPacket}
              onNavigateToMonitor={() => setActiveScreen('monitor')}
              onStartPackaging={() => setActiveScreen('alerts')}
            />
          )}

          {/* Screen 2: Live Drying Monitor & Curves */}
          {activeScreen === 'monitor' && (
            <DryingMonitor
              sensorData={sensorData}
              historyData={historyData}
            />
          )}

          {/* Screen 3 & 4: AI Predictions & CV Quality Trays */}
          {activeScreen === 'ai' && (
            <AIPredictions
              sensorData={sensorData}
            />
          )}

          {/* Screen 8: Production Analytics & Branches Dried breakdown */}
          {activeScreen === 'batches' && (
            <BatchAnalytics
              period={period}
              setPeriod={setPeriod}
              batchStats={batchStats}
            />
          )}

          {/* Screen 5 & 7: Chamber Alerts & Smart Packaging */}
          {activeScreen === 'alerts' && (
            <AlertsPackaging
              onStartSealing={() => setActiveScreen('home')}
            />
          )}
        </main>

        {/* Bottom Floating Navigation Bar */}
        <Navbar
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
          onQuickAction={() => setActiveScreen('batches')}
        />
      </div>
    </div>
  );
}
