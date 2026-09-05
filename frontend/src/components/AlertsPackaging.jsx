import React, { useState } from 'react';
import { 
  Bell, 
  PackageCheck, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function AlertsPackaging({ onStartSealing }) {
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' or 'packaging'
  const [alertFilter, setAlertFilter] = useState('all');
  const [sealedCount, setSealedCount] = useState(14);
  const [sealingStatus, setSealingStatus] = useState(null);

  const alerts = [
    {
      id: 1,
      type: 'warning',
      title: 'High Temperature Detected',
      desc: 'Proactive smart exhaust fan engaged. Temperature stabilized within safe limit.',
      time: '12 min ago'
    },
    {
      id: 2,
      type: 'info',
      title: 'Low Power Transition',
      desc: 'Solar array dimmed slightly. Battery seamlessly powering airflow fan.',
      time: '35 min ago'
    },
    {
      id: 3,
      type: 'warning',
      title: 'Drying Almost Complete',
      desc: 'Moisture target of 8.5% approaching in ~14 minutes. Prepare packaging trays.',
      time: 'Just now'
    },
    {
      id: 4,
      type: 'info',
      title: 'System Running Normal',
      desc: 'All chamber parameters are within certified Ayurvedic aroma limits.',
      time: '1 hour ago'
    }
  ];

  const filteredAlerts = alertFilter === 'all' 
    ? alerts 
    : alerts.filter(a => a.type === alertFilter);

  const handleSeal = () => {
    setSealingStatus('sealing');
    setTimeout(() => {
      setSealingStatus('done');
      setSealedCount(c => c + 1);
      setTimeout(() => setSealingStatus(null), 2500);
    }, 1200);
  };

  return (
    <div className="alerts-packaging-view">
      {/* Switcher Tab */}
      <div style={{ display: 'flex', background: 'white', padding: '4px', borderRadius: '24px', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
        <button
          onClick={() => setActiveTab('alerts')}
          style={{
            flex: 1,
            border: 'none',
            background: activeTab === 'alerts' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'alerts' ? 'white' : 'var(--text-muted)',
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
          <Bell size={15} />
          Chamber Alerts
        </button>
        <button
          onClick={() => setActiveTab('packaging')}
          style={{
            flex: 1,
            border: 'none',
            background: activeTab === 'packaging' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'packaging' ? 'white' : 'var(--text-muted)',
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
          <PackageCheck size={15} />
          Smart Packaging
        </button>
      </div>

      {activeTab === 'alerts' ? (
        <>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['all', 'critical', 'warning', 'info'].map((f) => (
              <button
                key={f}
                onClick={() => setAlertFilter(f)}
                style={{
                  border: '1px solid var(--border-color)',
                  background: alertFilter === f ? 'var(--primary)' : 'white',
                  color: alertFilter === f ? 'white' : 'var(--text-muted)',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: alertFilter === f ? '600' : '500',
                  textTransform: 'capitalize',
                  cursor: 'pointer'
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Alert cards list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className={`alert-card ${alert.type}`}>
                <div style={{ marginTop: '2px' }}>
                  {alert.type === 'critical' && <AlertTriangle size={17} color="#d9534f" />}
                  {alert.type === 'warning' && <AlertTriangle size={17} color="#f0ad4e" />}
                  {alert.type === 'info' && <CheckCircle size={17} color="var(--primary)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="alert-title">{alert.title}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{alert.time}</span>
                  </div>
                  <div className="alert-desc">{alert.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Screen 7: Smart Packaging Flow */}
          <div className="packaging-step-card">
            {/* Step progress pills */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '14px' }}>
              <span style={{ color: 'var(--emerald)' }}>✓ Drying</span>
              <span>→</span>
              <span style={{ color: 'var(--emerald)' }}>✓ Quality Check</span>
              <span>→</span>
              <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Packaging</span>
            </div>

            {/* Agarbatti Pouch Mockup */}
            <div className="pouch-illustration">
              <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--primary)', letterSpacing: '1px' }}>
                AROMAAI
              </div>
              <div style={{ width: '36px', height: '2px', background: 'var(--accent-orange)', margin: '4px 0' }}></div>
              <div style={{ fontSize: '7.5px', color: '#684d34', textAlign: 'center', padding: '0 6px' }}>
                Handcrafted Sandal Agarbatti
              </div>
              <div style={{ marginTop: '14px', fontSize: '8.5px', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                20 Sticks
              </div>
            </div>

            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)', marginTop: '8px' }}>
              Pack 20 sticks per pouch
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '4px auto 16px', maxWidth: '280px' }}>
              Use moisture-resistant packaging film for 100% authentic aroma preservation and shelf longevity.
            </p>

            <button 
              className="seal-action-btn"
              onClick={handleSeal}
              disabled={sealingStatus === 'sealing'}
            >
              {sealingStatus === 'sealing' ? (
                <>Thermal Sealing in progress...</>
              ) : sealingStatus === 'done' ? (
                <>
                  <Check size={18} /> Sealed & QR Logged!
                </>
              ) : (
                <>
                  Start Sealing <ArrowRight size={17} />
                </>
              )}
            </button>

            <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
              Completed pouches today: <strong style={{ color: 'var(--primary)' }}>{sealedCount}</strong>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
