import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Clock, 
  Layers, 
  Sparkles,
  Calendar
} from 'lucide-react';

export default function HomeDashboard({ 
  sensorData, 
  period, 
  batchStats,
  hasLiveMqtt,
  onOpenReport
}) {
  const formatValue = (val, decimals = 1) => {
    if (val === null || val === undefined || isNaN(Number(val))) return "--";
    return Number(val).toFixed(decimals);
  };

  const temperature = formatValue(sensorData.temperature, 1);
  const humidity = formatValue(sensorData.humidity, 1);
  const airflow = sensorData.airflow || "Good";
  const progressPercent = sensorData.progress !== undefined ? sensorData.progress : 82;
  const qualityScore = sensorData.qualityScore !== undefined ? sensorData.qualityScore : 91;
  const startTime = sensorData.startTime || "08:30 AM";
  const elapsedTime = sensorData.elapsedTime || "1h 14m";
  const estimatedTime = sensorData.estimatedTime || "24 min ± 4 min";
  const currentBatchId = sensorData.batchId || "AGB-2026-0902-001";
  const currentPeriodStats = batchStats[period] || batchStats.day;

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((hasLiveMqtt ? progressPercent : 0) / 100) * circumference;

  return (
    <div className="home-dashboard-view">
      <div className="artisan-header">
        <div className="greeting-text">
          <h2>Hello, Meena 👋</h2>
          <p>Good morning! Smart drying system active.</p>
        </div>
        <div className="artisan-avatar-wrap" title="Meena - Lead Artisan">
          <img
            className="artisan-avatar-img"
            src="/artisan-profile.jpg"
            alt="Meena, lead artisan"
          />
        </div>
      </div>

      <div className="batch-status-banner">
        <div className="batch-info-left">
          <span className="batch-label">Current Batch</span>
          <span className="batch-id">{currentBatchId}</span>
        </div>
        <div className="batch-status-badge">
          <span className="pulse-dot"></span>
          <span>Drying</span>
        </div>
      </div>

      <div className="primary-metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon-wrap temp">
              <Thermometer size={18} />
            </div>
            <span className="metric-badge badge-optimal">In range</span>
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

      <div className="branches-card">
        <div className="branches-header">
          <div className="branches-title">
            <Layers size={17} color="var(--primary)" />
            <span>3. Branches Dried</span>
          </div>
          <div className="period-pills">
            <button className="period-pill-btn" onClick={() => onOpenReport('day')}>
              1 Day
            </button>
            <button className="period-pill-btn" onClick={() => onOpenReport('week')}>
              1 Week
            </button>
            <button className="period-pill-btn" onClick={() => onOpenReport('month')}>
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

      <div className="gauges-card-row">
        <div className="gauge-card">
          <span className="gauge-title">Drying Progress</span>
          <div className="progress-ring-box">
            <svg width="104" height="104" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="52" cy="52" r={radius} stroke="#e8f3ec" strokeWidth="9" fill="none" />
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
              <span className="progress-ring-sub">{hasLiveMqtt ? "Chamber drying" : "Waiting sensors"}</span>
            </div>
          </div>
        </div>

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

      <div className="ai-insight-box">
        <div className="ai-insight-icon">
          <Sparkles size={18} />
        </div>
        <div className="ai-insight-text">
          <h4>AI Insight & Guidance</h4>
          <p>
            {hasLiveMqtt 
              ? `Chamber telemetry is streaming. Temperature is at ${temperature}°C with ${humidity}% humidity.`
              : "Waiting for chamber sensors. Values will update when the drying session sends readings."}
          </p>
        </div>
      </div>
    </div>
  );
}
