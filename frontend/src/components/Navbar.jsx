import React from 'react';
import { Home, Activity, Plus, Bell, BarChart3 } from 'lucide-react';

export default function Navbar({ activeScreen, setActiveScreen, onQuickAction }) {
  return (
    <nav className="bottom-nav-bar" aria-label="Mobile Navigation">
      {/* 1. Home Dashboard */}
      <button
        className={`nav-item-btn ${activeScreen === 'home' ? 'active' : ''}`}
        onClick={() => setActiveScreen('home')}
      >
        <Home size={20} />
        <span>Home</span>
      </button>

      {/* 2. Drying Monitor (Live Trends) */}
      <button
        className={`nav-item-btn ${activeScreen === 'monitor' ? 'active' : ''}`}
        onClick={() => setActiveScreen('monitor')}
      >
        <Activity size={20} />
        <span>Monitor</span>
      </button>

      {/* Center Floating Action Button (+) */}
      <button
        className="nav-center-action"
        onClick={onQuickAction}
        title="Quick Batch Action"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* 4. AI & Quality Trays */}
      <button
        className={`nav-item-btn ${activeScreen === 'ai' ? 'active' : ''}`}
        onClick={() => setActiveScreen('ai')}
      >
        <BarChart3 size={20} />
        <span>AI / Trays</span>
      </button>

      {/* 5. Alerts & Packaging */}
      <button
        className={`nav-item-btn ${activeScreen === 'alerts' ? 'active' : ''}`}
        onClick={() => setActiveScreen('alerts')}
      >
        <Bell size={20} />
        <span>Alerts</span>
      </button>
    </nav>
  );
}
