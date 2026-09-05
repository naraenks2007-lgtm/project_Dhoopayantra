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
  BatteryCharging
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

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Current live sensor telemetry
  const [sensorData, setSensorData] = useState({
    temperature: 39.4,
    humidity: 34.0,
    distance_cm: 14.5,
    pot_raw: 2840,
    pot_volts: 2.45,
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
    temperature: [36.2, 37.1, 38.0, 38.8, 39.1, 39.3, 39.4, 39.5, 39.2, 39.4],
    humidity: [58.0, 52.5, 46.0, 41.2, 37.5, 35.8, 35.0, 34.5, 34.2, 34.0],
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

  // 2. Connect to FastAPI WebSocket
  useEffect(() => {
    if (isSimulating) {
      if (socketRef.current) {
        socketRef.current.close();
      }
      setWsStatus('online');
      return;
    }

    let isSubscribed = true;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || '127.0.0.1';
      // Default FastAPI port is 8000
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
            console.log('📩 Incoming Sensor Data:', data);

            setSensorData((prev) => {
              const updatedTemp = data.temperature !== undefined ? parseFloat(data.temperature) : prev.temperature;
              const updatedHum = data.humidity !== undefined ? parseFloat(data.humidity) : prev.humidity;

              // Append to history buffer for smooth live sparkline graphs
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
        console.error('WebSocket connection initialization error:', err);
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

  // 3. IoT Simulator loop (active when isSimulating is ON or fallback)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setSensorData((prev) => {
        // Subtle natural fluctuation
        const dTemp = (Math.random() - 0.5) * 0.4;
        const dHum = (Math.random() - 0.5) * 0.5;
        const newTemp = parseFloat((Math.max(38.0, Math.min(41.5, prev.temperature + dTemp))).toFixed(1));
        const newHum = parseFloat((Math.max(31.0, Math.min(36.5, prev.humidity + dHum))).toFixed(1));
        const newDist = parseFloat((14.0 + Math.random() * 0.8).toFixed(1));
        const newPotVolts = parseFloat((2.4 + Math.random() * 0.1).toFixed(2));

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
                  <span>{isSimulating ? 'Sim Mode' : 'Live WS'}</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} />
                  <span>Offline (Reconnecting)</span>
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
