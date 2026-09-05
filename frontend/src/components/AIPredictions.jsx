import React, { useState } from 'react';
import { 
  BrainCircuit, 
  CheckCircle, 
  AlertTriangle, 
  Flame, 
  ShieldCheck, 
  Sparkles,
  Camera
} from 'lucide-react';

export default function AIPredictions({ sensorData }) {
  const [activeTab, setActiveTab] = useState('predictions'); // 'predictions' or 'trays'

  const trays = [
    { id: 1, score: 96, status: 'Good' },
    { id: 2, score: 94, status: 'Good' },
    { id: 3, score: 95, status: 'Good' },
    { id: 4, score: 91, status: 'Good' },
    { id: 5, score: 70, status: 'Needs attention' },
    { id: 6, score: 91, status: 'Good' },
    { id: 7, score: 95, status: 'Good' },
    { id: 8, score: 92, status: 'Good' },
    { id: 9, score: 94, status: 'Good' },
  ];

  return (
    <div className="ai-predictions-view">
      {/* View Switcher */}
      <div style={{ display: 'flex', background: 'white', padding: '4px', borderRadius: '24px', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
        <button
          onClick={() => setActiveTab('predictions')}
          style={{
            flex: 1,
            border: 'none',
            background: activeTab === 'predictions' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'predictions' ? 'white' : 'var(--text-muted)',
            padding: '7px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <BrainCircuit size={15} />
          AI Predictions
        </button>
        <button
          onClick={() => setActiveTab('trays')}
          style={{
            flex: 1,
            border: 'none',
            background: activeTab === 'trays' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'trays' ? 'white' : 'var(--text-muted)',
            padding: '7px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Camera size={15} />
          CV Tray Inspection
        </button>
      </div>

      {activeTab === 'predictions' ? (
        <>
          {/* Main AI Card: Remaining Drying Time */}
          <div className="metric-card" style={{ marginBottom: '12px', background: 'linear-gradient(135deg, #ffffff 0%, #f6faf7 100%)' }}>
            <div className="metric-header">
              <span className="metric-label" style={{ fontSize: '13px' }}>Remaining Drying Time</span>
              <div style={{ background: 'var(--accent-gold-light)', color: 'var(--accent-gold)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px' }}>
                24
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--primary)', letterSpacing: '-0.5px' }}>
              24 min <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: '500' }}>± 4 min</span>
            </div>
            <div className="metric-footer-note" style={{ color: 'var(--emerald)', fontWeight: '500' }}>
              ● On schedule for 100% aroma preservation
            </div>
          </div>

          {/* AI Indicators List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
            
            {/* Moisture Level */}
            <div style={{ background: 'white', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e8f4fc', color: '#2980b9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: '600' }}>Moisture Level</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target: 8.0% - 10.0%</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>8.7%</div>
                <div style={{ fontSize: '10.5px', color: 'var(--emerald)', fontWeight: '600' }}>Optimal</div>
              </div>
            </div>

            {/* Quality Score */}
            <div style={{ background: 'white', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--emerald-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: '600' }}>Quality Score</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Based on ML texture vision</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>91/100</div>
                <div style={{ fontSize: '10.5px', color: 'var(--emerald)', fontWeight: '600' }}>Excellent</div>
              </div>
            </div>

            {/* Breakage Risk */}
            <div style={{ background: 'white', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3e7', color: '#e67e22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: '600' }}>Breakage Risk</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bend & fragility sensor</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>3.2%</div>
                <div style={{ fontSize: '10.5px', color: 'var(--emerald)', fontWeight: '600' }}>Low Risk</div>
              </div>
            </div>

            {/* Fragrance Protection */}
            <div style={{ background: 'white', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f9edf7', color: '#8e44ad', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flame size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: '600' }}>Fragrance Protection</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Essential oil retention</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>98.2%</div>
                <div style={{ fontSize: '10.5px', color: 'var(--emerald)', fontWeight: '600' }}>Good</div>
              </div>
            </div>

          </div>

          <div className="ai-insight-box">
            <div className="ai-insight-icon">
              <Sparkles size={18} />
            </div>
            <div className="ai-insight-text">
              <h4>Optimal Temperature Maintained</h4>
              <p>Chamber air distribution is preventing warping and preserving authentic herbal aroma compounds.</p>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Computer Vision Tray Inspection Grid (Screen 4) */}
          <div style={{ background: 'white', padding: '14px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>Chamber Racks Inspection</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Camera visual defect analysis</p>
              </div>
              <span className="metric-badge badge-optimal">8/9 Trays Optimal</span>
            </div>

            <div className="tray-grid">
              {trays.map((tray) => (
                <div key={tray.id} className={`tray-card ${tray.status === 'Good' ? 'good' : 'warning'}`}>
                  <div className="tray-num">Tray {tray.id}</div>
                  <div className="tray-score">{tray.score}%</div>
                  <div className={`tray-status ${tray.status === 'Good' ? 'good' : 'warning'}`}>
                    {tray.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ai-insight-box" style={{ background: 'var(--accent-orange-light)', borderColor: 'rgba(224, 122, 95, 0.3)' }}>
            <div className="ai-insight-icon" style={{ background: 'var(--accent-orange)' }}>
              <AlertTriangle size={18} />
            </div>
            <div className="ai-insight-text">
              <h4 style={{ color: '#b24424' }}>Tray 5 Needs Attention</h4>
              <p style={{ color: '#682916' }}>Slight moisture concentration detected near rear corner. Rerouting hot air vent automatically.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
