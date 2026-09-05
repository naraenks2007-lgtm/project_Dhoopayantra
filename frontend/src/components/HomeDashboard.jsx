import React from 'react';
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
  Calendar
} from 'lucide-react';

export default function HomeDashboard({ 
  sensorData, 
  period, 
  setPeriod, 
  batchStats,
  onNavigateToMonitor,
  onStartPackaging
}) {
  const temperature = sensorData.temperature !== undefined ? Number(sensorData.temperature).toFixed(1) : "39.4";
  const humidity = sensorData.humidity !== undefined ? Number(sensorData.humidity).toFixed(1) : "34.0";
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
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="home-dashboard-view">
      {/* Artisan Greeting */}
      <div className="artisan-header">
        <div className="greeting-text">
          <h2>Hello, Meena 👋</h2>
          <p>Good morning! Smart drying system active.</p>
        </div>
        <div className="artisan-avatar-wrap" title="Meena - Lead Artisan">
          {/* Stylized Artisan Avatar */}
          <svg viewBox="0 0 40 40" width="40" height="40">
            <circle cx="20" cy="20" r="20" fill="#E8F3EC" />
            <circle cx="20" cy="15" r="7" fill="#1E5E3A" />
            <path d="M8 36 C 8 26, 32 26, 32 36 Z" fill="#27AE60" />
            <circle cx="20" cy="13" r="1.5" fill="#F4A261" />
          </svg>
        </div>
      </div>

      {/* Batch Status Banner */}
      <div className="batch-status-banner">
        <div className="batch-info-left">
          <span className="batch-label">Current Batch</span>
          <span className="batch-id">{currentBatchId}</span>
        </div>
        <div className="batch-status-badge">
          <span className="pulse-dot"></span>
          <span>Drying In Progress</span>
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
            <span className="metric-badge badge-optimal">Optimal</span>
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
            <span className="metric-badge badge-optimal">Controlled</span>
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
            <span className="metric-badge badge-live">AI Predicted</span>
          </div>
          <div>
            <div className="metric-label">4. Est. Completion</div>
            <div className="metric-value-row">
              <span className="metric-value" style={{ fontSize: '19px' }}>{estimatedTime}</span>
            </div>
          </div>
          <div className="metric-footer-note">
            ~14 mins remaining
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
            Batch began this morning
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

      {/* Secondary Sensor Strip (Weight, Solar, Battery, Airflow) */}
      <div className="sensor-strip-card">
        <div className="sensor-strip-item">
          <span className="sensor-strip-label">Weight</span>
          <span className="sensor-strip-val">{weight} g</span>
          <span className="sensor-strip-status">-12g/hr</span>
        </div>
        <div className="sensor-strip-item">
          <span className="sensor-strip-label">Solar Power</span>
          <span className="sensor-strip-val">{solarPower}%</span>
          <span className="sensor-strip-status" style={{ color: '#E07A5F' }}>Active</span>
        </div>
        <div className="sensor-strip-item">
          <span className="sensor-strip-label">Battery</span>
          <span className="sensor-strip-val">{battery}%</span>
          <span className="sensor-strip-status">Healthy</span>
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
              <span className="progress-ring-val">{progressPercent}%</span>
              <span className="progress-ring-sub">Near dry</span>
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
                strokeDashoffset={125.6 - (qualityScore / 100) * 125.6}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <span className="quality-score-val">{qualityScore}/100</span>
            <span className="quality-score-rating">Excellent Quality</span>
          </div>
        </div>
      </div>

      {/* AI Insight banner */}
      <div className="ai-insight-box">
        <div className="ai-insight-icon">
          <Sparkles size={18} />
        </div>
        <div className="ai-insight-text">
          <h4>AI Insight & Guidance</h4>
          <p>
            Drying is proceeding normally. Estimated completion in 14 minutes.
            Aroma preservation index is at 98%.
          </p>
        </div>
      </div>
    </div>
  );
}
