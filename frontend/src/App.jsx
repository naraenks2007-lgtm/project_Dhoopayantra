import React, { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
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
  BatteryCharging
} from 'lucide-react';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('home');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [period, setPeriod] = useState('day');

  // WebSocket / MQTT Status
  const [wsStatus, setWsStatus] = useState('connecting'); // 'online' | 'connecting' | 'offline'
  const [mqttSource, setMqttSource] = useState('EMQX WebSocket'); // 'EMQX WebSocket' | 'FastAPI WS'

  // Live MQTT tracking state
  const [hasLiveMqtt, setHasLiveMqtt] = useState(false);
  const [mqttPacketCount, setMqttPacketCount] = useState(0);
  const [lastMqttTime, setLastMqttTime] = useState(null);
  const [rawMqtt, setRawMqtt] = useState(null);

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Batch session start time (fixed for current batch run)
  const sessionStartTime = useRef(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const sessionStartTimestamp = useRef(Date.now());

  // Live sensor telemetry
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
    startTime: sessionStartTime.current,
    elapsedTime: '0m',
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

  const mqttClientRef = useRef(null);
  const fastApiWsRef = useRef(null);

  // 1. Process incoming MQTT payload (from EMQX WebSocket or FastAPI WebSocket)
  const processIncomingMqttData = (data, sourceName = 'EMQX WebSocket') => {
    if (!data || typeof data !== 'object') return;

    const tempVal = data.temperature !== undefined ? parseFloat(data.temperature) : (data.temp !== undefined ? parseFloat(data.temp) : null);
    const humVal = data.humidity !== undefined ? parseFloat(data.humidity) : (data.hum !== undefined ? parseFloat(data.hum) : null);

    // Elapsed time calculation
    const elapsedMins = Math.floor((Date.now() - sessionStartTimestamp.current) / 60000);
    const elapsedHrs = Math.floor(elapsedMins / 60);
    const elapsedStr = elapsedHrs > 0 ? `${elapsedHrs}h ${elapsedMins % 60}m` : `${elapsedMins}m`;

    // Dynamic ETA calculation from temperature & humidity
    let calculatedEta = "24 min ± 4 min";
    let calculatedProgress = 82;
    let calculatedQuality = 91;

    if (tempVal !== null && humVal !== null) {
      const etaMins = Math.max(5, Math.round(humVal * 0.7 - (tempVal - 30) * 0.5));
      calculatedEta = `${etaMins} min ± 3 min`;
      calculatedProgress = Math.max(10, Math.min(98, Math.round(100 - (humVal - 25) * 1.8)));
      calculatedQuality = Math.max(75, Math.min(99, Math.round(96 - Math.abs(tempVal - 39.5) * 2 - Math.abs(humVal - 34) * 0.5)));
    }

    setHasLiveMqtt(true);
    setMqttPacketCount(c => c + 1);
    setLastMqttTime(new Date().toLocaleTimeString());
    setRawMqtt(data);
    setMqttSource(sourceName);
    setWsStatus('online');

    setSensorData(prev => {
      const updatedTemp = tempVal !== null ? tempVal : prev.temperature;
      const updatedHum = humVal !== null ? humVal : prev.humidity;

      // Update history sparklines
      setHistoryData(h => ({
        temperature: [...h.temperature.slice(1), updatedTemp],
        humidity: [...h.humidity.slice(1), updatedHum],
        weight: [...h.weight.slice(1), data.weight !== undefined ? data.weight : prev.weight]
      }));

      return {
        ...prev,
        ...data,
        temperature: updatedTemp,
        humidity: updatedHum,
        startTime: prev.startTime || sessionStartTime.current,
        elapsedTime: elapsedStr,
        estimatedTime: data.estimatedTime || calculatedEta,
        progress: calculatedProgress,
        qualityScore: calculatedQuality
      };
    });

    if (data.branches_dried) {
      setBatchStats(b => ({
        ...b,
        day: { ...b.day, branches: data.branches_dried.day },
        week: { ...b.week, branches: data.branches_dried.week },
        month: { ...b.month, branches: data.branches_dried.month }
      }));
    }
  };

  // 2. Primary: Connect to EMQX MQTT Broker directly over WebSocket (wss://broker.emqx.io:8084/mqtt)
  useEffect(() => {
    if (isSimulating) return;

    console.log('🔌 Connecting to EMQX MQTT Broker over WebSocket (wss://broker.emqx.io:8084/mqtt)...');
    
    // Connect via MQTT over WebSocket
    const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
      clientId: `aromaai-pwa-${Math.random().toString(16).substring(2, 8)}`,
      clean: true,
      connectTimeout: 8000,
      reconnectPeriod: 3000,
      keepalive: 60
    });

    mqttClientRef.current = client;

    client.on('connect', () => {
      console.log('✅ Direct EMQX WebSocket Connected! Subscribing to esp32/sensor_data...');
      setWsStatus('online');
      client.subscribe('esp32/sensor_data', (err) => {
        if (!err) {
          console.log('✅ Subscribed to topic: esp32/sensor_data over WebSocket');
        } else {
          console.error('Subscription error:', err);
        }
      });
    });

    client.on('message', (topic, message) => {
      try {
        const payloadStr = message.toString();
        const payload = JSON.parse(payloadStr);
        console.log(`📩 [EMQX WebSocket] Message on ${topic}:`, payload);
        processIncomingMqttData(payload, 'EMQX WebSocket');
      } catch (err) {
        console.warn('MQTT JSON parse error:', err);
      }
    });

    client.on('error', (err) => {
      console.warn('EMQX WebSocket warning:', err);
    });

    client.on('offline', () => {
      console.log('EMQX WebSocket offline, reconnecting...');
    });

    return () => {
      if (client) client.end(true);
    };
  }, [isSimulating]);

  // 3. Secondary: Connect to FastAPI WebSocket (ws://127.0.0.1:8000/ws/sensors) in main.py
  useEffect(() => {
    if (isSimulating) return;

    let isSubscribed = true;
    let reconnectTimeout = null;

    const connectFastApiWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || '127.0.0.1';
      const wsUrl = `${protocol}//${host}:8000/ws/sensors`;

      try {
        const ws = new WebSocket(wsUrl);
        fastApiWsRef.current = ws;

        ws.onopen = () => {
          if (!isSubscribed) return;
          console.log('✅ FastAPI WebSocket connected at', wsUrl);
          setWsStatus('online');
        };

        ws.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const data = JSON.parse(event.data);
            if (data.status !== 'connected_awaiting_mqtt') {
              console.log('📩 [FastAPI WebSocket] Telemetry received:', data);
              processIncomingMqttData(data, 'FastAPI WebSocket');
            }
          } catch (e) {
            console.error('FastAPI WS parse error:', e);
          }
        };

        ws.onclose = () => {
          if (isSubscribed) {
            reconnectTimeout = setTimeout(connectFastApiWs, 4000);
          }
        };
      } catch (err) {
        if (isSubscribed) {
          reconnectTimeout = setTimeout(connectFastApiWs, 4000);
        }
      }
    };

    connectFastApiWs();

    return () => {
      isSubscribed = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (fastApiWsRef.current) fastApiWsRef.current.close();
    };
  }, [isSimulating]);

  // 4. Publish Test MQTT Packet directly over WebSocket
  const handlePublishTestPacket = () => {
    const samplePayload = {
      temperature: parseFloat((39.2 + Math.random() * 2.2).toFixed(1)),
      humidity: parseFloat((33.5 + Math.random() * 2.5).toFixed(1)),
      distance_cm: parseFloat((14.2 + Math.random() * 0.8).toFixed(1)),
      pot_raw: Math.floor(2750 + Math.random() * 150),
      pot_volts: parseFloat((2.40 + Math.random() * 0.12).toFixed(2)),
      device: "ESP32_DRYER_001"
    };

    const payloadStr = JSON.stringify(samplePayload);

    // If EMQX WebSocket is connected, publish directly via MQTT over WebSocket!
    if (mqttClientRef.current && mqttClientRef.current.connected) {
      console.log('🚀 Publishing directly over EMQX WebSocket to esp32/sensor_data...');
      mqttClientRef.current.publish('esp32/sensor_data', payloadStr, { qos: 1 });
    } else if (fastApiWsRef.current && fastApiWsRef.current.readyState === WebSocket.OPEN) {
      console.log('🚀 Requesting publish over FastAPI WebSocket...');
      fastApiWsRef.current.send(JSON.stringify({ action: "publish_sample" }));
    } else {
      // Fallback local injection
      processIncomingMqttData(samplePayload, 'Local Telemetry');
    }
  };

  // 5. PWA Install handler
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
    if (outcome === 'accepted') setShowInstallBanner(false);
    setDeferredPrompt(null);
  };

  // 6. Simulation loop when toggled
  useEffect(() => {
    if (!isSimulating) return;

    setHasLiveMqtt(true);
    const interval = setInterval(() => {
      const curTemp = sensorData.temperature || 39.4;
      const curHum = sensorData.humidity || 34.0;
      const dTemp = (Math.random() - 0.5) * 0.4;
      const dHum = (Math.random() - 0.5) * 0.5;

      const simData = {
        temperature: parseFloat((Math.max(38.0, Math.min(41.5, curTemp + dTemp))).toFixed(1)),
        humidity: parseFloat((Math.max(31.0, Math.min(36.5, curHum + dHum))).toFixed(1)),
        distance_cm: parseFloat((14.0 + Math.random() * 0.8).toFixed(1)),
        pot_raw: Math.floor(2800 + Math.random() * 80),
        pot_volts: parseFloat((2.4 + Math.random() * 0.1).toFixed(2)),
        device: "ESP32_SIMULATOR"
      };

      processIncomingMqttData(simData, 'Simulated Stream');
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulating, sensorData.temperature, sensorData.humidity]);

  return (
    <div className="app-viewport">
      {/* Top Controls on Desktop */}
      <header className={`top-bar-controls ${isExpanded ? 'expanded-mode' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: '700', color: 'var(--primary)', letterSpacing: '0.5px' }}>
            🌿 AromaAI
          </span>
          <span style={{ fontSize: '11px', color: '#828f87' }}>WebSocket PWA</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={`sim-toggle-btn ${isSimulating ? 'active' : ''}`}
            onClick={() => setIsSimulating(!isSimulating)}
            title="Toggle simulated IoT data generator"
          >
            {isSimulating ? <Pause size={13} /> : <Play size={13} />}
            <span>{isSimulating ? 'Simulating' : 'Simulate IoT'}</span>
          </button>

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

      {/* Main Container Shell */}
      <div className={`device-shell ${isExpanded ? 'expanded' : ''}`}>
        {!isExpanded && (
          <div className="device-notch">
            <div className="device-notch-sensor"></div>
            <div className="device-notch-camera"></div>
          </div>
        )}

        {/* System Bar */}
        <div className="system-status-bar">
          <span>09:44 AM</span>

          {/* WebSocket Status Indicator */}
          <div className="system-status-icons">
            <span className={`ws-status-pill ${wsStatus === 'online' ? 'online' : 'offline'}`}>
              {wsStatus === 'online' ? (
                <>
                  <Wifi size={12} />
                  <span>{hasLiveMqtt ? `Live WebSocket (${mqttSource})` : 'WebSocket Connected'}</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} />
                  <span>Connecting WebSocket...</span>
                </>
              )}
            </span>
            <BatteryCharging size={15} color="var(--primary)" />
          </div>
        </div>

        {/* Scrollable Content Container */}
        <main className="main-scroll-content">
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
