import { useState } from 'react';

const BEDS = [
  { id: 'BED_4A', label: 'Bed 4A', name: 'Rahul Sharma', status: 'stable' },
  { id: 'BED_3B', label: 'Bed 3B', name: 'Priya Nair', status: 'watch' },
  { id: 'BED_7C', label: 'Bed 7C', name: 'Kavya Reddy', status: 'critical' },
];

export default function Camera() {
  const [selected, setSelected] = useState('BED_4A');
  const selectedBed = BEDS.find(b => b.id === selected);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Patient Feed</h1>
          <div className="page-breadcrumb">Ward 3B · ESP32-CAM · Motion detection enabled</div>
        </div>
        <div className="live-indicator">
          <span className="live-dot" /> STREAMING
        </div>
      </div>

      {/* Main feed */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="card-label" style={{ marginBottom: 0 }}>
            {selectedBed?.label} — {selectedBed?.name}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {BEDS.map(b => (
              <button
                key={b.id}
                onClick={() => setSelected(b.id)}
                style={{
                  padding: '4px 10px',
                  fontSize: 12, borderRadius: 4, cursor: 'pointer',
                  border: selected === b.id ? '1px solid var(--blue)' : '1px solid var(--border)',
                  background: selected === b.id ? 'var(--blue-bg)' : 'var(--bg-surface-alt)',
                  color: selected === b.id ? 'var(--blue-dark)' : 'var(--text-secondary)',
                  fontWeight: selected === b.id ? 600 : 400,
                }}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
        <div className="camera-main-feed">
          <div className="live-badge">
            <span className="live-badge-dot" /> LIVE
          </div>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#CDD2D8" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 7l-7 5 7 5V7z"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Feed loading... · ESP32-CAM connecting
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono', marginTop: 4 }}>
            192.168.1.105:81/stream
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <div className="blynk-row" style={{ margin: 0 }}>
            <span className="blynk-dot" />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Mobile access via Blynk: Active</span>
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: 'var(--text-muted)' }}>
            1080p · 15fps · Motion Armed
          </div>
        </div>
      </div>

      {/* Thumbnail grid — other beds */}
      <div className="card">
        <div className="card-label">All Bed Feeds</div>
        <div className="camera-grid">
          {BEDS.map(b => (
            <div
              key={b.id}
              className="camera-thumb"
              onClick={() => setSelected(b.id)}
              style={{
                cursor: 'pointer',
                border: selected === b.id ? '2px solid var(--blue)' : '1px solid var(--border)',
                borderRadius: 6,
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#CDD2D8" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 7l-7 5 7 5V7z"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
              <div className="camera-thumb-label">{b.label}</div>
              {selected === b.id && (
                <div style={{ position: 'absolute', top: 6, right: 6, background: 'var(--blue)', borderRadius: 3, padding: '1px 5px', fontSize: 9, color: '#fff', fontWeight: 700 }}>
                  ACTIVE
                </div>
              )}
            </div>
          ))}
          {/* Empty thumbs for layout */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`empty-${i}`} className="camera-thumb">
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No Feed</span>
            </div>
          ))}
        </div>
      </div>

      {/* Motion events */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-label">Motion Events — Today</div>
        {[
          { time: '02:14 AM', bed: 'Bed 4A', desc: 'Patient movement detected — restlessness' },
          { time: '12:58 AM', bed: 'Bed 7C', desc: 'Staff entry recorded' },
          { time: 'Yesterday 11:30 PM', bed: 'Bed 3B', desc: 'IV line adjustment motion' },
        ].map(({ time, bed, desc }, i) => (
          <div key={i} className="alert-row">
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0, marginTop: 4 }} />
            <div className="alert-desc">
              <strong style={{ fontWeight: 500 }}>{bed}</strong> · {desc}
            </div>
            <div className="alert-time">{time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
