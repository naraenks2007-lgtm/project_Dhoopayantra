import React, { useState } from 'react';
import { 
  Layers, 
  TrendingUp, 
  Zap, 
  Calendar, 
  CheckCircle2, 
  Award,
  Clock,
  Search
} from 'lucide-react';

export default function BatchAnalytics({ period, batchStats, onOpenReport }) {
  const [searchTerm, setSearchTerm] = useState('');

  const currentStats = batchStats[period] || batchStats.day;

  const pastBatches = [
    { id: 'AGB-2026-0902-001', score: '91/100', status: 'Excellent', branches: 400, time: '7h 12m' },
    { id: 'AGB-2026-0901-008', score: '87/100', status: 'Good', branches: 380, time: '7h 45m' },
    { id: 'AGB-2026-0831-021', score: '95/100', status: 'Excellent', branches: 420, time: '6h 58m' },
    { id: 'AGB-2026-0830-014', score: '90/100', status: 'Excellent', branches: 390, time: '7h 20m' },
    { id: 'AGB-2026-0829-019', score: '88/100', status: 'Good', branches: 370, time: '7h 35m' },
  ];

  const filteredBatches = pastBatches.filter(b => 
    b.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="batch-analytics-view">
      {/* Header */}
      <div className="artisan-header" style={{ marginBottom: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>SHG Analytics</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Today, 03 Sep 2026 • Livelihood Metrics</p>
        </div>
        <div style={{ background: 'var(--emerald-subtle)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: '600' }}>
          91/100 Avg Quality
        </div>
      </div>

      {/* Main Focus: Branches Dried in 1 Day / 1 Week / 1 Month */}
      <div className="branches-card" style={{ border: '2px solid var(--primary-subtle)' }}>
        <div className="branches-header">
          <div className="branches-title">
            <Layers size={18} color="var(--primary)" />
            <span style={{ fontSize: '14px' }}>Branches Dried Overview</span>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '4px', marginBottom: '12px' }}>
          <div style={{ background: 'var(--bg-app)', padding: '10px 12px', borderRadius: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Branches Dried</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)', marginTop: '2px' }}>
              {currentStats.branches.toLocaleString()}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--emerald)', fontWeight: '600' }}>
              +{currentStats.growth}% higher productivity
            </div>
          </div>

          <div style={{ background: 'var(--bg-app)', padding: '10px 12px', borderRadius: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Batches Completed</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
              {currentStats.batches}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
              Avg {Math.round(currentStats.branches / (currentStats.batches || 1))} sticks/batch
            </div>
          </div>
        </div>

        {/* Breakdown bar chart */}
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
          Production Trend ({currentStats.label})
        </div>
        <div className="mini-branches-bars" style={{ height: '70px' }}>
          {currentStats.history.map((h, i) => (
            <div key={i} className="bar-column">
              <div 
                className={`bar-fill ${i === currentStats.history.length - 1 ? 'highlight' : ''}`}
                style={{ height: `${h.percentage}%` }}
              />
              <span className="bar-label">{h.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Screen 8 KPIs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
        <div style={{ background: 'white', padding: '10px', borderRadius: '14px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
            <Clock size={12} /> Avg Dry Time
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginTop: '3px' }}>7h 42m</div>
        </div>

        <div style={{ background: 'white', padding: '10px', borderRadius: '14px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
            <TrendingUp size={12} /> Breakage Rate
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--emerald)', marginTop: '3px' }}>5.2%</div>
        </div>

        <div style={{ background: 'white', padding: '10px', borderRadius: '14px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
            <Zap size={12} /> Solar Saved
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-orange)', marginTop: '3px' }}>1.8 kWh</div>
        </div>
      </div>

      {/* Screen 6 & 8: Batch History List */}
      <div style={{ background: 'white', padding: '14px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '600' }}>Batch Traceability History</h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pastBatches.length} recorded</span>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '9px' }} />
          <input
            type="text"
            placeholder="Search batch ID (e.g. AGB-2026)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px 7px 30px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              fontSize: '11px',
              fontFamily: 'var(--font-family)',
              background: 'var(--bg-app)'
            }}
          />
        </div>

        {/* Batch items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredBatches.map((b) => (
            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-app)', borderRadius: '10px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary)' }}>{b.id}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  {b.branches} branches • {b.time}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="metric-badge badge-optimal">{b.score}</span>
                <div style={{ fontSize: '10px', color: 'var(--emerald)', fontWeight: '600', marginTop: '2px' }}>{b.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
