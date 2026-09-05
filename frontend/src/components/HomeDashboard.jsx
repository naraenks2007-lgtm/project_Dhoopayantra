import React, { useState } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Clock, 
  Layers, 
  Sun, 
  BatteryCharging, 
  Wind, 
  Sparkles,
  CheckCircle2,
  Calendar,
  Radio,
  Send,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';

export default function HomeDashboard({ 
  sensorData, 
  period, 
  setPeriod, 
  batchStats,
  rawMqtt,
  mqttPacketCount,
  lastMqttTime,
  hasLiveMqtt,
  onPublishTestPacket,
  onNavigateToMonitor,
  onStartPackaging
}) {
  const [showRawMqtt, setShowRawMqtt] = useState(true);

  // Format values safely
  const formatValue = (val, decimals = 1) => {
    if (val === null || val === undefined || isNaN(Number(val))) return "--";
    return Number(val).toFixed(decimals);
  };

  const temperature = formatValue(sensorData.temperature, 1);
  const humidity = formatValue(sensorData.humidity, 1);
  const weight = sensorData.weight !== undefined ? sensorData.weight : 433;
  const solarPower = sensorData.solarPower !== undefined ? sensorData.solarPower : 72;
  const battery = sensorData.battery !== undefined ? sensorData.battery : 68;
  const airflow = sensorData.airflow || "Good";
  const progressPercent = sensorData.progress !== undefined ? sensorData.progress : 82;
  const qualityScore = sensorData.qualityScore !== undefined ? sensorData.qualityScore : 91;
  const startTime = sensorData.startTime || "08:30 AM";
  const elapsedTime = sensorData.elapsedTime || "1h 14m";
  const estimatedTime = sensorData.estimatedTime || "24 min ± 4 min";
  const currentBatchId = sensorData.batchId || "AGB-2026-0902-001";

  // Branch statistics based on selected period (Day / Week / Month)
  const currentPeriodStats = batchStats[period] || batchStats.day;

  // Circular gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((hasLiveMqtt ? progressPercent : 0) / 100) * circumference;

  return (
    <div className="home-dashboard-view">
      {/* Artisan Greeting */}
      <div className="artisan-header">
        <div className="greeting-text">
          <h2>Hello, Meena 👋</h2>
          <p>Good morning! Smart drying system active.</p>
        </div>
        <div className="artisan-avatar-wrap" title="Meena - Lead Artisan">
          <svg viewBox="0 0 40 40" width="40" height="40">
            <circle cx="20" cy="20" r="20" fill="#E8F3EC" />
            <circle cx="20" cy="15" r="7" fill="#1E5E3A" />
            <path d="M8 36 C 8 26, 32 26, 32 36 Z" fill="#27AE60" />
            <circle cx="20" cy="13" r="1.5" fill="#F4A261" />
          </svg>
        </div>
      </div>

      {/* Batch Status Banner with Live MQTT indicator */}
      <div className="batch-status-banner">
        <div className="batch-info-left">
          <span className="batch-label">Current Batch</span>
          <span className="batch-id">{currentBatchId}</span>
        </div>
        <div className="batch-status-badge" style={{
          background: hasLiveMqtt ? 'var(--emerald-subtle)' : '#fff3cd',
          color: hasLiveMqtt ? 'var(--primary)' : '#856404'
        }}>
          <span className="pulse-dot" style={{
            background: hasLiveMqtt ? 'var(--emerald)' : '#e67e22'
          }}></span>
          <span>{hasLiveMqtt ? `MQTT Live (${mqttPacketCount} pkts)` : 'Listening esp32/sensor_data'}</span>
        </div>
      </div>

      {/* 5 KEY DASHBOARD METRICS REQUESTED BY USER */}
      <div className="primary-metrics-grid">
        
        {/* 1. TEMPERATURE */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon-wrap temp">
              <Thermometer size={18} />
            </div>
            <span className={`metric-badge ${hasLiveMqtt ? 'badge-optimal' : 'badge-live'}`}>
              {hasLiveMqtt ? 'MQTT Live' : 'Waiting...'}
            </span>
          </div>
          <div>
            <div className="metric-label">1. Temperature</div>
            <div className="metric-value-row">
              <span className="metric-value">{temperature}</span>
              <span className="metric-unit">°C</span>
            </div>
          </div>
          <div className="metric-footer-note">
            Target: 38°C – 42°C
          </div>
        </div>

        {/* 2. HUMIDITY */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon-wrap humidity">
              <Droplets size={18} />
            </div>
            <span className={`metric-badge ${hasLiveMqtt ? 'badge-optimal' : 'badge-live'}`}>
              {hasLiveMqtt ? 'Controlled' : 'Waiting...'}
            </span>
          </div>
          <div>
            <div className="metric-label">2. Humidity</div>
            <div className="metric-value-row">
              <span className="metric-value">{humidity}</span>
              <span className="metric-unit">% RH</span>
            </div>
          </div>
          <div className="metric-footer-note">
            Target: 30% – 38%
          </div>
        </div>

        {/* 4. ESTIMATED TIME TO COMPLETE */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon-wrap time">
              <Clock size={18} />
            </div>
            <span className="metric-badge badge-live">AI Physics</span>
          </div>
          <div>
            <div className="metric-label">4. Est. Completion</div>
            <div className="metric-value-row">
              <span className="metric-value" style={{ fontSize: '18px' }}>{estimatedTime}</span>
            </div>
          </div>
          <div className="metric-footer-note">
            Target 8-10% moisture
          </div>
        </div>

        {/* 5. START TIME */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon-wrap branches">
              <Calendar size={18} />
            </div>
            <span className="metric-badge badge-optimal">Elapsed {elapsedTime}</span>
          </div>
          <div>
            <div className="metric-label">5. Start Time</div>
            <div className="metric-value-row">
              <span className="metric-value" style={{ fontSize: '20px' }}>{startTime}</span>
            </div>
          </div>
          <div className="metric-footer-note">
            Session active
          </div>
        </div>

      </div>

      {/* 3. NUMBER OF BRANCHES DRIED IN ONE DAY, ONE WEEK, ONE MONTH */}
      <div className="branches-card">
        <div className="branches-header">
          <div className="branches-title">
            <Layers size={17} color="var(--primary)" />
            <span>3. Branches Dried</span>
          </div>
          <div className="period-pills">
            <button 
              className={`period-pill-btn ${period === 'day' ? 'active' : ''}`}
              onClick={() => setPeriod('day')}
            >
              1 Day
            </button>
            <button 
              className={`period-pill-btn ${period === 'week' ? 'active' : ''}`}
              onClick={() => setPeriod('week')}
            >
              1 Week
            </button>
            <button 
              className={`period-pill-btn ${period === 'month' ? 'active' : ''}`}
              onClick={() => setPeriod('month')}
            >
              1 Month
            </button>
          </div>
        </div>

        <div className="branches-stat-display">
          <div>
            <div className="branches-big-num">
              {currentPeriodStats.branches.toLocaleString()} <span style={{ fontSize: '15px', fontWeight: '500' }}>branches</span>
            </div>
            <div className="branches-count-sub">
              {currentPeriodStats.batches} batches completed in {currentPeriodStats.label}
            </div>
          </div>
          <div className="branches-target-status">
            <div className="branches-percent">+{currentPeriodStats.growth}%</div>
            <div className="branches-target-label">vs previous {period}</div>
          </div>
        </div>

        {/* Mini distribution bars */}
        <div className="mini-branches-bars">
          {currentPeriodStats.history.map((item, idx) => (
            <div key={idx} className="bar-column">
              <div 
                className={`bar-fill ${idx === currentPeriodStats.history.length - 1 ? 'highlight' : ''}`}
                style={{ height: `${item.percentage}%` }}
                title={`${item.branches} branches`}
              />
              <span className="bar-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Sensor Strip (Distance, Pot Raw, Pot Volts, Airflow) from MQTT */}
      <div className="sensor-strip-card">
        <div className="sensor-strip-item">
          <span className="sensor-strip-label">Distance</span>
          <span className="sensor-strip-val">{sensorData.distance_cm ?? "--"} cm</span>
          <span className="sensor-strip-status">Ultrasonic</span>
        </div>
        <div className="sensor-strip-item">
          <span className="sensor-strip-label">Pot Raw</span>
          <span className="sensor-strip-val">{sensorData.pot_raw ?? "--"}</span>
          <span className="sensor-strip-status" style={{ color: '#E07A5F' }}>ADC</span>
        </div>
        <div className="sensor-strip-item">
          <span className="sensor-strip-label">Pot Voltage</span>
          <span className="sensor-strip-val">{sensorData.pot_volts ?? "--"} V</span>
          <span className="sensor-strip-status">Level</span>
        </div>
        <div className="sensor-strip-item">
          <span className="sensor-strip-label">Airflow</span>
          <span className="sensor-strip-val">{airflow}</span>
          <span className="sensor-strip-status">0.8 m/s</span>
        </div>
      </div>

      {/* Dual Gauges from Mockup (Screen 1): Drying Progress & AI Quality */}
      <div className="gauges-card-row">
        {/* Circular Drying Progress Gauge */}
        <div className="gauge-card">
          <span className="gauge-title">Drying Progress</span>
          <div className="progress-ring-box">
            <svg width="104" height="104" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="52"
                cy="52"
                r={radius}
                stroke="#e8f3ec"
                strokeWidth="9"
                fill="none"
              />
              <circle
                cx="52"
                cy="52"
                r={radius}
                stroke="var(--primary)"
                strokeWidth="9"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div className="progress-ring-text">
              <span className="progress-ring-val">{hasLiveMqtt ? `${progressPercent}%` : "--"}</span>
              <span className="progress-ring-sub">{hasLiveMqtt ? "Chamber drying" : "Waiting MQTT"}</span>
            </div>
          </div>
        </div>

        {/* Half Gauge / Arc: AI Quality Prediction */}
        <div className="gauge-card">
          <span className="gauge-title">AI Quality Prediction</span>
          <div className="quality-gauge-box">
            <svg width="104" height="56" viewBox="0 0 100 50">
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#e8f3ec"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="var(--emerald)"
                strokeWidth="10"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 - ((hasLiveMqtt ? qualityScore : 0) / 100) * 125.6}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <span className="quality-score-val">{hasLiveMqtt ? `${qualityScore}/100` : "--"}</span>
            <span className="quality-score-rating">{hasLiveMqtt ? "Excellent Quality" : "Pending sensor"}</span>
          </div>
        </div>
      </div>

      {/* LIVE MQTT TELEMETRY INSPECTOR (Exact live JSON stream from main.py) */}
      <div style={{
        background: '#15201b',
        color: '#d9f7e6',
        borderRadius: '16px',
        padding: '14px 16px',
        marginBottom: '16px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid rgba(39, 174, 96, 0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={16} color="var(--emerald)" className={hasLiveMqtt ? "pulse-dot" : ""} />
            <strong style={{ fontSize: '12.5px', color: '#f0fdf4' }}>
              📡 Live MQTT Payload (from main.py)
            </strong>
          </div>
          <button
            onClick={() => setShowRawMqtt(!showRawMqtt)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px'
            }}
          >
            {showRawMqtt ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{showRawMqtt ? 'Collapse' : 'Expand'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#86efac', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <span>Topic: <code>esp32/sensor_data</code></span>
          <span>Packets: <strong>{mqttPacketCount}</strong></span>
          <span>Last: <strong>{lastMqttTime || '--'}</strong></span>
        </div>

        {showRawMqtt && (
          <>
            <pre style={{
              margin: 0,
              padding: '10px',
              background: '#0d1511',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#86efac',
              fontFamily: 'monospace',
              maxHeight: '160px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {rawMqtt ? JSON.stringify(rawMqtt, null, 2) : "// Waiting for incoming MQTT messages on 'esp32/sensor_data'..."}
            </pre>

            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                Broker: <code>broker.emqx.io:8084</code>
              </span>
              <button
                onClick={onPublishTestPacket}
                style={{
                  background: 'var(--primary-light)',
                  color: 'white',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Publish a sample MQTT packet to broker.emqx.io to verify live flow"
              >
                <Send size={12} />
                <span>Publish Test MQTT</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* AI Insight banner */}
      <div className="ai-insight-box">
        <div className="ai-insight-icon">
          <Sparkles size={18} />
        </div>
        <div className="ai-insight-text">
          <h4>AI Insight & Guidance</h4>
          <p>
            {hasLiveMqtt 
              ? `Chamber telemetry is streaming live from MQTT. Temperature is at ${temperature}°C with ${humidity}% humidity.`
              : "Backend is connected. Listening to MQTT broker on topic esp32/sensor_data. Values will update live upon message arrival."}
          </p>
        </div>
      </div>
    </div>
  );
}
