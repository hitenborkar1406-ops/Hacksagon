import { useState } from 'react';
import { MOCK_ALERTS, severityLabel, relativeTime } from '../utils/formatVitals';

const TYPE_CONFIG = {
  SPO2_LOW:    { cls: 'danger',  icon: '🩸' },
  BACKFLOW:    { cls: 'danger',  icon: '🔴' },
  HR_ABNORMAL: { cls: 'warning', icon: '💓' },
  IV_STOPPED:  { cls: 'warning', icon: '⛔' },
};

export default function Alerts() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const unacked = alerts.filter(a => !a.acked).length;

  function ackAlert(id) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acked: true } : a));
  }

  function ackAll() {
    setAlerts(prev => prev.map(a => ({ ...a, acked: true })));
  }

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alert History</h1>
          <div className="page-breadcrumb">
            {unacked > 0
              ? `${unacked} unacknowledged alert${unacked > 1 ? 's' : ''} · Updating via Socket`
              : 'All alerts acknowledged'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {unacked > 0 && (
            <button
              onClick={ackAll}
              style={{
                padding: '7px 16px', border: '1px solid var(--border)',
                borderRadius: 4, fontSize: 13, cursor: 'pointer',
                background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              Acknowledge All
            </button>
          )}
          <div className="live-indicator">
            <span className="live-dot" /> LIVE
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Alerts', val: alerts.length, color: 'var(--text-primary)' },
          { label: 'Unacknowledged', val: unacked, color: 'var(--red)' },
          { label: 'Critical', val: alerts.filter(a => ['SPO2_LOW', 'BACKFLOW'].includes(a.type)).length, color: 'var(--red-dark)' },
          { label: 'This Hour', val: alerts.filter(a => (Date.now() - new Date(a.ts)) < 3600000).length, color: 'var(--blue)' },
        ].map(({ label, val, color }) => (
          <div key={label} className="card" style={{ padding: '16px 20px' }}>
            <div className="card-label">{label}</div>
            <div className="data-value" style={{ color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Alert list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {alerts.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            No alerts on record.
          </div>
        ) : (
          alerts.map(a => {
            const cfg = TYPE_CONFIG[a.type] || { cls: 'info', icon: '⚠' };
            return (
              <div
                key={a.id}
                className={`alert-card${!a.acked ? ' unread' : ''}`}
              >
                <div className={`alert-icon ${cfg.cls}`}>{cfg.icon}</div>
                <div className="alert-content">
                  <div className="alert-title">{a.message}</div>
                  <div className="alert-meta">
                    {a.room} · {a.patientId} · {relativeTime(a.ts)}
                  </div>
                </div>
                {!a.acked && (
                  <button
                    onClick={() => ackAlert(a.id)}
                    style={{
                      padding: '4px 10px', fontSize: 11,
                      border: '1px solid var(--border)', borderRadius: 3,
                      cursor: 'pointer', background: 'var(--bg-surface)',
                      color: 'var(--text-secondary)', whiteSpace: 'nowrap',
                    }}
                  >
                    Ack
                  </button>
                )}
                {a.acked && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>✓ Acked</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
