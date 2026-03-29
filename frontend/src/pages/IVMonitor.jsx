import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePatientContext } from '../context/patientContext.js';
import { useIV } from '../hooks/useIV.js';
import { controlValve } from '../api/index.js';

export default function IVMonitor() {
  const { selectedPatientId, selectedPatient } = usePatientContext();
  const { ivData } = useIV(selectedPatientId);
  const [valveLoading, setValveLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [flowHistory, setFlowHistory] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({ t: i, flow: 44 + (Math.random() - 0.5) * 4 }))
  );
  const [now, setNow] = useState(new Date());

  // Update flowHistory when new IV data arrives
  useEffect(() => {
    if (!ivData) return;
    setFlowHistory(prev => {
      const last = prev[prev.length - 1];
      const next = [...prev.slice(1), { t: last.t + 1, flow: ivData.rate ?? ivData.prescribedRate ?? 45 }];
      return next;
    });
  }, [ivData]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Derived values — prefer live, fall back to sensible defaults
  const remaining    = ivData?.remaining    ?? 500;
  const prescribedRate = selectedPatient?.prescribedRate ?? 45;
  const rate         = ivData?.valveOpen ? prescribedRate : 0;
  const valveOpen    = ivData?.valveOpen ?? true;
  const backflow     = ivData?.backflow   ?? false;
  const pctInfused   = Math.round((1 - remaining / 500) * 100);
  const estHours     = rate > 0 ? (remaining / rate).toFixed(1) : '—';

  async function toggleValve() {
    if (!selectedPatientId || valveLoading) return;
    const action = valveOpen ? 'close' : 'open';
    setValveLoading(true);
    try {
      await controlValve(selectedPatientId, action);
      setToast(`Valve ${action === 'open' ? 'opened' : 'closed'} successfully`);
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast('Failed to update valve — check backend');
      setTimeout(() => setToast(null), 4000);
    } finally {
      setValveLoading(false);
    }
  }

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">IV Monitor</h1>
          <div className="page-breadcrumb">
            {selectedPatient
              ? `${selectedPatient.name} · ${selectedPatient.bedNumber} · Solenoid Valve + Flow Sensor`
              : 'Loading patient...'}
          </div>
        </div>
        <div className="page-timestamp">{now.toLocaleTimeString()}</div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 6,
          padding: '10px 16px', marginBottom: 16, fontSize: 13,
          color: 'var(--text-primary)', boxShadow: 'var(--shadow)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ color: 'var(--blue)', fontWeight: 600 }}>◎</span> {toast}
        </div>
      )}

      {/* Backflow banner */}
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
        {/* IV Bag Visual */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="card-label" style={{ marginBottom: 8 }}>IV Bag</div>
            <svg viewBox="0 0 80 130" style={{ width: 70, height: 115 }}>
              <path d="M20 10 Q10 10 10 25 L10 90 Q10 110 40 110 Q70 110 70 90 L70 25 Q70 10 60 10 Z" fill="#F0F2F5" stroke="#CDD2D8" strokeWidth="1.5"/>
              <clipPath id="ivFillMonitor">
                <rect x="10" y={10 + (1 - remaining / 500) * 80} width="60" height={remaining / 500 * 80 + 20} />
              </clipPath>
              <path d="M20 10 Q10 10 10 25 L10 90 Q10 110 40 110 Q70 110 70 90 L70 25 Q70 10 60 10 Z" fill="#EBF3FD" clipPath="url(#ivFillMonitor)"/>
              <line x1="40" y1="110" x2="40" y2="125" stroke="#CDD2D8" strokeWidth="1.5"/>
              {valveOpen && (
                <ellipse className="drip-drop" cx="40" cy="127" rx="2.5" ry="4" fill="#2C7BE5" opacity="0.7"/>
              )}
              <circle cx="40" cy="6" r="4" fill="none" stroke="#CDD2D8" strokeWidth="1.5"/>
              <line x1="40" y1="2" x2="40" y2="0" stroke="#CDD2D8" strokeWidth="1.5"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 8 }}>
              <div className="card-label">Remaining</div>
              <div className="data-value">{remaining.toFixed(0)}</div>
              <div className="data-unit">mL</div>
            </div>
            <div className="iv-progress-track" style={{ marginBottom: 6 }}>
              <div className="iv-progress-fill" style={{ width: `${Math.min(pctInfused, 100)}%` }} />
            </div>
            <div className="iv-caption">{pctInfused}% infused · Est. {estHours}h</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              500 mL bag · Prescribed: {prescribedRate} mL/hr
            </div>
          </div>
        </div>

        {/* Valve Status + Control */}
        <div className="card" style={!valveOpen ? { borderColor: 'rgba(217,48,37,0.3)' } : {}}>
          <div className="card-label">Solenoid Valve</div>
          <div className={`valve-status ${valveOpen ? '' : 'closed'}`}>{valveOpen ? 'OPEN' : 'CLOSED'}</div>
          <div className="valve-indicator-row">
            <span className={`valve-dot ${valveOpen ? 'open' : 'closed'}`} />
            <span>{valveOpen ? 'Flow active' : 'Flow stopped'}</span>
          </div>
          <button
            onClick={toggleValve}
            disabled={valveLoading}
            style={{
              marginTop: 16, padding: '8px 16px',
              border: `1px solid ${valveOpen ? 'var(--red)' : 'var(--blue)'}`,
              borderRadius: 4, fontSize: 13, cursor: valveLoading ? 'not-allowed' : 'pointer',
              background: valveOpen ? 'var(--red-bg)' : 'var(--blue-bg)',
              color: valveOpen ? 'var(--red-dark)' : 'var(--blue-dark)',
              fontWeight: 500, opacity: valveLoading ? 0.6 : 1,
              width: '100%', transition: 'all 0.15s',
            }}
          >
            {valveLoading ? 'Updating...' : valveOpen ? 'Close Valve' : 'Open Valve'}
          </button>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>
            Backflow: {backflow ? '⚠ detected' : '✓ clear'}
          </div>
        </div>

        {/* Flow rate info */}
        <div className="card">
          <div className="card-label">Current IV Rate</div>
          <div>
            <span className="data-value">{rate}</span>
            <span className="data-unit"> mL/hr</span>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            Prescribed: <span style={{ fontFamily: 'IBM Plex Mono' }}>{prescribedRate} mL/hr</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
            Status: <span style={{ color: valveOpen ? 'var(--blue-dark)' : 'var(--red-dark)', fontWeight: 500 }}>
              {valveOpen ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>
      </div>

      {/* Flow chart */}
      <div className="card">
        <div className="card-label">IV Flow Rate — Last 30 Readings</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={flowHistory} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="flowGradMonitor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#2C7BE5" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#2C7BE5" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
            <XAxis dataKey="t" tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#8A97A4' }} tickLine={false} axisLine={{ stroke: '#E2E6EA' }} tickFormatter={v => `${v}`} interval={5} />
            <YAxis tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#8A97A4' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E6EA', borderRadius: 6, fontFamily: 'IBM Plex Mono', fontSize: 11 }} />
            <Area type="monotone" dataKey="flow" stroke="#2C7BE5" strokeWidth={1.5} fill="url(#flowGradMonitor)" dot={false} name="Flow (mL/hr)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Backflow sensor card */}
      <div className="card">
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
          <div style={{
            padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12,
            background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)',
            fontFamily: 'IBM Plex Mono',
          }}>
            {backflow ? 'AUTO-CLOSED' : 'NOMINAL'}
          </div>
        </div>
      </div>
    </div>
  );
}
