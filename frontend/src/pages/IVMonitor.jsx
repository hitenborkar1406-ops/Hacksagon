import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateHistory } from '../utils/formatVitals';

function genFlowHistory(len = 30) {
  return Array.from({ length: len }, (_, i) => ({
    t: i, flow: 44 + (Math.random() - 0.5) * 4,
  }));
}

export default function IVMonitor() {
  const [flowRate, setFlowRate] = useState(45);
  const [valve, setValve] = useState('OPEN');
  const [backflow, setBackflow] = useState(false);
  const [infused] = useState(67);
  const [flowHistory, setFlowHistory] = useState(genFlowHistory);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => {
      setFlowRate(v => Math.max(0, Math.min(100, v + (Math.random() - 0.5) * 2)));
      setFlowHistory(prev => {
        const last = prev[prev.length - 1];
        return [...prev.slice(1), { t: last.t + 1, flow: Math.max(0, Math.min(100, last.flow + (Math.random() - 0.5) * 3)) }];
      });
      setNow(new Date());
    }, 2000);
    return () => clearInterval(tick);
  }, []);

  function toggleValve() {
    setValve(v => (v === 'OPEN' ? 'CLOSED' : 'OPEN'));
  }

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">IV Monitor</h1>
          <div className="page-breadcrumb">Rahul Sharma · Bed 4A · Solenoid Valve + Flow Sensor</div>
        </div>
        <div className="page-timestamp">{now.toLocaleTimeString()}</div>
      </div>

      {/* Backflow banner (only when detected) */}
      {backflow && (
        <div className="backflow-banner">
          <div className="backflow-banner-icon">🔴</div>
          <div className="backflow-banner-text">
            <div className="backflow-banner-title">Backflow Detected</div>
            <div className="backflow-banner-sub">Solenoid valve has been auto-closed. Check IV line immediately.</div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="iv-monitor-grid">
        {/* Flow Rate */}
        <div className="card">
          <div className="card-label">IV Drip Rate</div>
          <div>
            <span className="data-value">{flowRate.toFixed(1)}</span>
            <span className="data-unit"> mL/hr</span>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button
              onClick={() => setFlowRate(v => Math.max(0, v - 5))}
              style={{ padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 16, cursor: 'pointer', background: 'var(--bg-surface-alt)' }}
            >−</button>
            <button
              onClick={() => setFlowRate(v => Math.min(200, v + 5))}
              style={{ padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 16, cursor: 'pointer', background: 'var(--bg-surface-alt)' }}
            >+</button>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>Prescribed: 45 mL/hr</div>
        </div>

        {/* Valve Status */}
        <div className="card" style={valve === 'CLOSED' ? { borderColor: 'rgba(217,48,37,0.3)' } : {}}>
          <div className="card-label">Solenoid Valve</div>
          <div className={`valve-status ${valve === 'CLOSED' ? 'closed' : ''}`}>{valve}</div>
          <div className="valve-indicator-row">
            <span className={`valve-dot ${valve === 'OPEN' ? 'open' : 'closed'}`} />
            <span>{valve === 'OPEN' ? 'Flow active' : 'Flow stopped'}</span>
          </div>
          <button
            onClick={toggleValve}
            style={{
              marginTop: 12, padding: '6px 14px',
              border: `1px solid ${valve === 'OPEN' ? 'var(--blue)' : 'var(--red)'}`,
              borderRadius: 4, fontSize: 12, cursor: 'pointer',
              background: valve === 'OPEN' ? 'var(--blue-bg)' : 'var(--red-bg)',
              color: valve === 'OPEN' ? 'var(--blue-dark)' : 'var(--red-dark)',
              fontWeight: 500,
            }}
          >
            Toggle Valve
          </button>
        </div>

        {/* Infusion progress */}
        <div className="card">
          <div className="card-label">Infusion Progress</div>
          <div>
            <span className="data-value">{infused}</span>
            <span className="data-unit">% infused</span>
          </div>
          <div className="iv-progress-track" style={{ marginTop: 14 }}>
            <div className="iv-progress-fill" style={{ width: `${infused}%` }} />
          </div>
          <div className="iv-caption" style={{ marginTop: 8 }}>165 mL remaining · Est. 3h 40m</div>
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>500 mL bag · Started: 06:30 AM</div>
        </div>
      </div>

      {/* Flow chart */}
      <div className="card" style={{ marginTop: 0 }}>
        <div className="card-label">IV Flow Rate — Last 30 Readings</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={flowHistory} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2C7BE5" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#2C7BE5" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
            <XAxis dataKey="t" tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#8A97A4' }} tickLine={false} axisLine={{ stroke: '#E2E6EA' }} tickFormatter={v => `${v}s`} interval={5} />
            <YAxis tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#8A97A4' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E6EA', borderRadius: 6, fontFamily: 'IBM Plex Mono', fontSize: 11 }} />
            <Area type="monotone" dataKey="flow" stroke="#2C7BE5" strokeWidth={1.5} fill="url(#flowGrad)" dot={false} name="Flow (mL/hr)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Backflow simulate toggle */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-label">Backflow Sensor</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, color: backflow ? 'var(--red-dark)' : 'var(--text-primary)', fontWeight: 500 }}>
              {backflow ? '🔴 Backflow Detected' : '✓ No Backflow — Line Clear'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Sensor: IR optical · Threshold: 2 mL reverse flow
            </div>
          </div>
          <button
            onClick={() => { setBackflow(v => !v); if (!backflow) setValve('CLOSED'); else setValve('OPEN'); }}
            style={{ padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, cursor: 'pointer', background: 'var(--bg-surface-alt)' }}
          >
            Simulate {backflow ? 'Clear' : 'Backflow'}
          </button>
        </div>
      </div>
    </div>
  );
}
