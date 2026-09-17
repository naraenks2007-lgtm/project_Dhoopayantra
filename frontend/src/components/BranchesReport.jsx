import React from 'react';
import { ArrowLeft, Download, Layers, CalendarRange, Clock, BarChart3 } from 'lucide-react';
import { downloadTextPdf } from '../utils/pdfDownload';

const PERIOD_META = {
  day: { title: '1 Day Report', rangeLabel: 'Today' },
  week: { title: '1 Week Report', rangeLabel: 'Past 7 Days' },
  month: { title: '1 Month Report', rangeLabel: 'This Month' }
};

export default function BranchesReport({ period, batchStats, onBack }) {
  const stats = batchStats[period] || batchStats.day;
  const meta = PERIOD_META[period] || PERIOD_META.day;
  const daysInRange = stats.daysInRange || 1;
  const avgPerDay = Math.round((stats.branches || 0) / daysInRange);

  const handleDownloadPdf = () => {
    downloadTextPdf(
      `AromaAI-branches-${period}-report.pdf`,
      `AromaAI ${meta.title}`,
      [
        `Generated: ${new Date().toLocaleString()}`,
        '',
        `Period: ${meta.rangeLabel}`,
        `Number of batches: ${stats.batches}`,
        `Branches dried: ${Number(stats.branches).toLocaleString()}`,
        `Start time: ${stats.startTime}`,
        `End time: ${stats.endTime}`,
        `Average per day: ${avgPerDay.toLocaleString()} branches`,
        `Days in range: ${daysInRange}`,
        `Growth vs previous period: +${stats.growth}%`
      ]
    );
  };

  return (
    <div className="branches-report-view" id="branches-report-print">
      <div className="report-toolbar no-print">
        <button className="report-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to dashboard</span>
        </button>
        <button className="seal-action-btn report-pdf-btn" onClick={handleDownloadPdf}>
          <Download size={16} />
          <span>Download as PDF</span>
        </button>
      </div>

      <header className="report-hero">
        <p className="report-kicker">AromaAI production report</p>
        <h2>{meta.title}</h2>
        <p className="report-subtitle">{meta.rangeLabel} · branches dried</p>
      </header>

      <div className="report-metrics-grid">
        <article className="report-metric-card">
          <div className="metric-icon-wrap branches">
            <Layers size={18} />
          </div>
          <span className="metric-label">Number of batches</span>
          <strong className="metric-value">{stats.batches}</strong>
          <span className="metric-footer-note">{Number(stats.branches).toLocaleString()} branches dried</span>
        </article>

        <article className="report-metric-card">
          <div className="metric-icon-wrap time">
            <Clock size={18} />
          </div>
          <span className="metric-label">Start time</span>
          <strong className="report-time-value">{stats.startTime}</strong>
        </article>

        <article className="report-metric-card">
          <div className="metric-icon-wrap temp">
            <CalendarRange size={18} />
          </div>
          <span className="metric-label">End time</span>
          <strong className="report-time-value">{stats.endTime}</strong>
        </article>

        <article className="report-metric-card">
          <div className="metric-icon-wrap humidity">
            <BarChart3 size={18} />
          </div>
          <span className="metric-label">Average per day</span>
          <strong className="metric-value">{avgPerDay.toLocaleString()}</strong>
          <span className="metric-footer-note">branches / day across {daysInRange} day{daysInRange > 1 ? 's' : ''}</span>
        </article>
      </div>
    </div>
  );
}
