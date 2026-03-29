import { useState } from 'react';
import { useAlerts } from '../hooks/useAlerts.js';

const SEVERITY_CONFIG = {
  critical: { border: '#D93025', bg: '#FDECEA', label: 'CRITICAL', labelColor: '#9B2218' },
  warning:  { border: '#F4A100', bg: '#FEF6E4', label: 'WARNING',  labelColor: '#7D5000' },
  info:     { border: '#2C7BE5', bg: '#EBF3FD', label: 'INFO',     labelColor: '#1A4F9C' },
};

const FILTERS = ['All', 'Critical', 'Warning', 'Resolved'];

function relativeTime(ts) {
  if (!ts) return '--';
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return new Date(ts).toLocaleTimeString();
}

export default function Alerts() {
  const { alerts, unresolvedCount, resolveAlert } = useAlerts(null); // null = all patients
  const [activeFilter, setActiveFilter] = useState('All');
  const [resolving, setResolving] = useState(null);

  const filtered = alerts.filter(a => {
    if (activeFilter === 'All')      return true;
    if (activeFilter === 'Critical') return a.severity === 'critical';
    if (activeFilter === 'Warning')  return a.severity === 'warning';
    if (activeFilter === 'Resolved') return a.acknowledged || a.resolved;
    return true;
  });

  // For unresolved list, separate active from resolved
  const active   = filtered.filter(a => !a.acknowledged && !a.resolved);
  const resolved = filtered.filter(a =>  a.acknowledged ||  a.resolved);
  const display  = activeFilter === 'Resolved' ? resolved : [...active, ...resolved];

  async function handleResolve(id) {
    setResolving(id);
    await resolveAlert(id);
    setResolving(null);
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  const resolvedCount = alerts.filter(a => a.acknowledged || a.resolved).length;

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alert History</h1>
          <div className="page-breadcrumb">
            {unresolvedCount > 0
              ? `${unresolvedCount} unresolved alert${unresolvedCount > 1 ? 's' : ''} · Live via Socket.io`
              : 'All alerts resolved'}
          </div>
        </div>
        <div className="live-indicator">
          <span className="live-dot" /> LIVE
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Alerts', val: alerts.length, color: 'var(--text-primary)' },
          { label: 'Unresolved',   val: unresolvedCount, color: 'var(--red)' },
          { label: 'Critical',     val: criticalCount, color: 'var(--red-dark)' },
          { label: 'Resolved',     val: resolvedCount, color: 'var(--blue)' },
        ].map(({ label, val, color }) => (
          <div key={label} className="card" style={{ padding: '16px 20px' }}>
            <div className="card-label">{label}</div>
            <div className="data-value" style={{ color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: '6px 14px', fontSize: 12, borderRadius: 20, cursor: 'pointer',
              border: activeFilter === f ? '1px solid var(--blue)' : '1px solid var(--border)',
              background: activeFilter === f ? 'var(--blue-bg)' : 'var(--bg-surface)',
              color: activeFilter === f ? 'var(--blue-dark)' : 'var(--text-secondary)',
              fontWeight: activeFilter === f ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {display.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            No alerts in this category.
          </div>
        ) : (
          display.map((a) => {
            const cfg = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.info;
            const isResolved = a.acknowledged || a.resolved;
            return (
              <div
                key={a._id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border)',
                  borderLeft: `3px solid ${isResolved ? 'var(--border)' : cfg.border}`,
                  background: isResolved ? 'var(--bg-surface)' : cfg.bg,
                }}
              >
                {/* Severity pill */}
                <span style={{
                  fontSize: 9, fontFamily: 'IBM Plex Mono', fontWeight: 700,
                  padding: '2px 6px', borderRadius: 3,
                  background: cfg.border, color: '#fff',
                  whiteSpace: 'nowrap', marginTop: 2, flexShrink: 0,
                }}>
                  {cfg.label}
                </span>

                <div className="alert-content" style={{ flex: 1 }}>
                  <div className="alert-title">{a.message}</div>
                  <div className="alert-meta">
                    {a.type && <span style={{ marginRight: 8 }}>{a.type.replace(/_/g, ' ')}</span>}
                    {a.patientId && <span style={{ marginRight: 8 }}>Patient: {a.patientId}</span>}
                    {relativeTime(a.timestamp)}
                  </div>
                </div>

                {!isResolved ? (
                  <button
                    onClick={() => handleResolve(a._id)}
                    disabled={resolving === a._id}
                    style={{
                      padding: '5px 12px', fontSize: 12,
                      border: '1px solid var(--border)', borderRadius: 4,
                      cursor: resolving === a._id ? 'not-allowed' : 'pointer',
                      background: 'var(--bg-surface)', color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap', opacity: resolving === a._id ? 0.6 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {resolving === a._id ? '...' : 'Resolve'}
                  </button>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono', flexShrink: 0 }}>
                    ✓ Resolved
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
