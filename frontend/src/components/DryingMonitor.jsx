import React, { useState } from 'react';
import { Thermometer, Droplets, Scale, Sparkles, Sliders, Activity } from 'lucide-react';

export default function DryingMonitor({ sensorData, historyData }) {
  const [activeSubTab, setActiveSubTab] = useState('Live');

  const tempCurrent = sensorData.temperature !== undefined ? Number(sensorData.temperature).toFixed(1) : "39.4";
  const humidityCurrent = sensorData.humidity !== undefined ? Number(sensorData.humidity).toFixed(1) : "34.0";
  const weightCurrent = sensorData.weight !== undefined ? sensorData.weight : 433;
  const distanceCurrent = sensorData.distance_cm !== undefined ? sensorData.distance_cm : 14.5;
  const potVolts = sensorData.pot_volts !== undefined ? sensorData.pot_volts : 2.45;

  // Helper to generate smooth SVG path from history numbers
  const generatePath = (dataPoints, minVal, maxVal, width = 340, height = 70) => {
    if (!dataPoints || dataPoints.length < 2) return "";
    const range = maxVal - minVal || 1;
    const stepX = width / (dataPoints.length - 1);
    
    const points = dataPoints.map((val, idx) => {
      const x = idx * stepX;
      const normalizedY = 1 - (val - minVal) / range;
      const y = Math.max(5, Math.min(height - 5, normalizedY * height));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(" L ")}`;
  };

  const tempPath = generatePath(historyData.temperature, 30, 48);
  const humPath = generatePath(historyData.humidity, 20, 60);
  const weightPath = generatePath(historyData.weight, 400, 500);

  return (
    <div className="drying-monitor-view">
      {/* Header */}
      <div className="artisan-header" style={{ marginBottom: '10px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Drying Monitor</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real-time chamber curves & IoT sensors</p>
        </div>
        <div style={{ display: 'flex', gap: '4px', background: 'white', padding: '3px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
          {['Live', 'Trends', 'History'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              style={{
                border: 'none',
                background: activeSubTab === tab ? 'var(--primary)' : 'transparent',
                color: activeSubTab === tab ? 'white' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '11px',
                fontWeight: activeSubTab === tab ? '600' : '400',
                cursor: 'pointer'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Temperature Trend Card */}
      <div className="monitor-chart-card">
        <div className="chart-header">
          <div className="chart-title">
            <Thermometer size={16} color="var(--accent-orange)" />
            <span>Temperature</span>
          </div>
          <span className="chart-current-val">{tempCurrent} °C</span>
        </div>
        <svg className="sparkline-svg" viewBox="0 0 340 70">
          <path
            d={tempPath}
            fill="none"
            stroke="var(--accent-orange)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Subtle gradient fill underneath */}
          <path
            d={`${tempPath} L 340,70 L 0,70 Z`}
            fill="rgba(224, 122, 95, 0.12)"
          />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span>-30 min</span>
          <span>Target: 38°C – 42°C</span>
          <span>Now</span>
        </div>
      </div>

      {/* Humidity Trend Card */}
      <div className="monitor-chart-card">
        <div className="chart-header">
          <div className="chart-title">
            <Droplets size={16} color="#2980b9" />
            <span>Chamber Humidity</span>
          </div>
          <span className="chart-current-val">{humidityCurrent} % RH</span>
        </div>
        <svg className="sparkline-svg" viewBox="0 0 340 70">
          <path
            d={humPath}
            fill="none"
            stroke="#2980b9"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d={`${humPath} L 340,70 L 0,70 Z`}
            fill="rgba(41, 128, 185, 0.12)"
          />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span>-30 min</span>
          <span>Optimal Drying Range</span>
          <span>Now</span>
        </div>
      </div>

      {/* Weight Loss Curve Card */}
      <div className="monitor-chart-card">
        <div className="chart-header">
          <div className="chart-title">
            <Scale size={16} color="var(--primary)" />
            <span>Batch Weight Loss</span>
          </div>
          <span className="chart-current-val">{weightCurrent} g</span>
        </div>
        <svg className="sparkline-svg" viewBox="0 0 340 70">
          <path
            d={weightPath}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d={`${weightPath} L 340,70 L 0,70 Z`}
            fill="rgba(30, 94, 58, 0.12)"
          />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span>Initial: 495 g</span>
          <span>Evaporation: 62 g lost</span>
          <span>Now: {weightCurrent} g</span>
        </div>
      </div>

      {/* Additional Hardware Sensor Stream (Distance & Potentiometer from main.py) */}
      <div className="monitor-chart-card" style={{ padding: '12px 14px' }}>
        <div className="chart-header" style={{ marginBottom: '4px' }}>
          <div className="chart-title">
            <Sliders size={16} color="var(--primary)" />
            <span>IoT Cirkit / ESP32 Telemetry</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--emerald)', fontWeight: '600' }}>● Live Stream</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px', textAlign: 'center' }}>
          <div style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Chamber Dist</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{distanceCurrent} cm</div>
          </div>
          <div style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Potentiometer</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{potVolts} V</div>
          </div>
          <div style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Air Velocity</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>0.85 m/s</div>
          </div>
        </div>
      </div>

      {/* AI Insight banner */}
      <div className="ai-insight-box">
        <div className="ai-insight-icon">
          <Sparkles size={18} />
        </div>
        <div className="ai-insight-text">
          <h4>AI Insight</h4>
          <p>
            Drying is proceeding normally. Moisture gradient is uniform across all drying racks.
            Estimated completion in 14 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
