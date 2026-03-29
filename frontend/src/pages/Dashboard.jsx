import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { usePatientContext } from '../context/patientContext.js';
import { useVitals } from '../hooks/useVitals.js';
import { useIV } from '../hooks/useIV.js';
import { useAlerts } from '../hooks/useAlerts.js';
import { useBottleSessions } from '../hooks/useBottleSessions.js';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ── Local mock helpers (used only when backend is unavailable) ── */
function genSparkline(base, range, count = 8) {
  return Array.from({ length: count }, (_, i) => ({ i, v: base + (Math.random() - 0.5) * range }));
}

function generateDrugImpactMini() {
  return Array.from({ length: 20 }, (_, i) => ({
    t: i,
    spo2: 96 + (i < 5 ? 0 : Math.min(2.5, (i - 5) * 0.4 + (Math.random() - 0.5) * 0.2)),
    rate: i < 5 ? 0 : i < 15 ? 45 : Math.max(0, 45 - (i - 15) * 5),
  }));
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function generateFallbackChartHistory() {
  return Array.from({ length: 30 }, (_, i) => ({
    t: i,
    hr: 78 + Math.sin(i * 0.4) * 6 + Math.cos(i * 0.8) * 1.5,
    spo2: 97 + Math.sin(i * 0.2) * 1.5 + Math.cos(i * 0.45) * 0.3,
  }));
}

export default function Dashboard() {
  const { selectedPatientId, selectedPatient } = usePatientContext();
  const { vitals, latest } = useVitals(selectedPatientId);
  const { ivData } = useIV(selectedPatientId);
  const { alerts } = useAlerts(selectedPatientId);
  const { sessions: bottleSessions, refetch: refetchSessions } = useBottleSessions('rahul-sharma');

  // Fallback local simulation when backend isn't ready yet
  const [localHr, setLocalHr] = useState(78);
  const [localSpo2, setLocalSpo2] = useState(97);
  const [hrSpark, setHrSpark] = useState(() => genSparkline(78, 6));
  const [spo2Spark, setSpo2Spark] = useState(() => genSparkline(97, 1.5));
  const [drugData] = useState(generateDrugImpactMini);
  const [fallbackChartHistory] = useState(generateFallbackChartHistory);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => {
      setLocalHr(v => Math.max(55, Math.min(120, v + (Math.random() - 0.5) * 2.5)));
      setLocalSpo2(v => Math.max(92, Math.min(100, v + (Math.random() - 0.5) * 0.5)));
      setHrSpark(prev => [...prev.slice(1), { i: prev.length, v: 78 + (Math.random() - 0.5) * 8 }]);
      setSpo2Spark(prev => [...prev.slice(1), { i: prev.length, v: 97 + (Math.random() - 0.5) * 1.5 }]);
      setNow(new Date());
    }, 3000);
    return () => clearInterval(tick);
  }, []);

  // Prefer live data, fall back to local simulation
  const hr = latest?.heartRate ?? localHr;
  const spo2 = latest?.spo2 ?? localSpo2;
  const ivRemaining = ivData?.remaining ?? 500;
  const ivRate = ivData?.rate ?? (ivData?.valveOpen ? (selectedPatient?.prescribedRate ?? 45) : 0);
  const valveOpen = ivData?.valveOpen ?? true;
  const ivPct = Math.round((1 - ivRemaining / 500) * 100);
  const estHours = ivRate > 0 ? (ivRemaining / ivRate).toFixed(1) : '—';

  const hrStatus = hr > 110 ? 'danger' : hr < 50 ? 'danger' : hr > 100 ? 'warning' : 'normal';
  const spo2Status = spo2 < 92 ? 'danger' : spo2 < 95 ? 'warning' : 'normal';

  // Build chart history from accumulating socket vitals
  const chartHistory = vitals.length >= 2
    ? vitals.map((v, i) => ({ t: i, hr: v.heartRate, spo2: v.spo2, ts: v.timestamp }))
    : fallbackChartHistory;

  const recentAlerts = alerts.slice(0, 3);

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="page-body">
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">ICU Dashboard</h1>
          <div className="page-breadcrumb">
            {selectedPatient
              ? `${selectedPatient.ward} · ${selectedPatient.bedNumber} — ${selectedPatient.name} · Active monitoring`
              : 'Ward 3B · Loading patient...'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="page-timestamp">{timeStr} · {dateStr}</div>
          <div className="live-indicator" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
            <span className="live-dot" />
            LIVE
          </div>
        </div>
      </div>

      {/* ── Row 1: Stat cards ── */}
      <div className="dash-row-1">
        {/* Heart Rate */}
        <div className="card">
          <div className="card-label">Heart Rate</div>
          <div>
            <span className="stat-value">{Math.round(hr)}</span>
            <span className="stat-unit">BPM</span>
          </div>
          <svg className="sparkline-svg" viewBox={`0 0 ${hrSpark.length * 14} 28`} preserveAspectRatio="none">
            <polyline
              points={hrSpark.map((d, i) => `${i * 14},${28 - ((d.v - 60) / 40) * 28}`).join(' ')}
              stroke="#2C7BE5" strokeWidth="1.5" fill="none"
            />
          </svg>
          <span className={`status-pill ${hrStatus}`}>
            {hrStatus === 'normal' ? 'Normal' : hrStatus === 'warning' ? 'Elevated' : 'Abnormal'}
          </span>
        </div>

        {/* SpO2 */}
        <div className="card">
          <div className="card-label">Blood Oxygen (SpO₂)</div>
          <div>
            <span className="stat-value">{spo2.toFixed(1)}</span>
            <span className="stat-unit">%</span>
          </div>
          <svg className="sparkline-svg" viewBox={`0 0 ${spo2Spark.length * 14} 28`} preserveAspectRatio="none">
            <polyline
              points={spo2Spark.map((d, i) => `${i * 14},${28 - ((d.v - 90) / 10) * 28}`).join(' ')}
              stroke="#2C7BE5" strokeWidth="1.5" fill="none"
            />
          </svg>
          <span className={`status-pill ${spo2Status}`}>
            {spo2Status === 'normal' ? 'Normal' : spo2Status === 'warning' ? 'Watch' : 'Critical'}
          </span>
        </div>

        {/* IV Drip Rate */}
        <div className="card">
          <div className="card-label">IV Drip Rate</div>
          <div>
            <span className="stat-value">{ivRate}</span>
            <span className="stat-unit">mL / hr</span>
          </div>
          <div className="iv-progress-track">
            <div className="iv-progress-fill" style={{ width: `${Math.min(ivPct, 100)}%` }} />
          </div>
          <div className="iv-caption">{ivRemaining.toFixed(0)} mL left · {estHours}h est.</div>
        </div>

        {/* Solenoid Valve */}
        <div className="card">
          <div className="card-label">Solenoid Valve</div>
          <div className={`valve-status ${valveOpen ? '' : 'closed'}`}>
            {valveOpen ? 'OPEN' : 'CLOSED'}
          </div>
          <div className="valve-indicator-row">
            <span className={`valve-dot ${valveOpen ? 'open' : 'closed'}`} />
            <span>{valveOpen ? 'Flow active' : 'Flow stopped'}</span>
          </div>
        </div>
      </div>

      {/* ── Row 2: Vitals chart + IV bag ── */}
      <div className="dash-row-2">
        {/* Vitals chart */}
        <div className="card">
          <div className="card-label">Vitals — Last 30 Readings</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartHistory} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
              <XAxis
                dataKey="t"
                tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#8A97A4' }}
                tickLine={false}
                axisLine={{ stroke: '#E2E6EA' }}
                tickFormatter={v => `${v}`}
                interval={5}
              />
              <YAxis tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#8A97A4' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #E2E6EA', borderRadius: 6, fontFamily: 'IBM Plex Mono', fontSize: 11 }}
              />
              <Line type="monotone" dataKey="hr" stroke="#2C7BE5" strokeWidth={1.5} dot={false} name="HR (BPM)" isAnimationActive={false} />
              <Line type="monotone" dataKey="spo2" stroke="#52606D" strokeWidth={1} strokeDasharray="5 3" dot={false} name="SpO₂ %" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <span className="legend-pill">
              <span className="legend-swatch" style={{ background: '#2C7BE5' }} /> Heart Rate
            </span>
            <span className="legend-pill">
              <span className="legend-swatch" style={{ background: '#52606D' }} /> SpO₂
            </span>
          </div>
        </div>

        {/* IV Bag Status */}
        <div className="card">
          <div className="card-label">IV Bag Status</div>
          <div className="iv-bag-container">
            <svg className="iv-bag-svg" viewBox="0 0 80 130">
              {/* Bag outline */}
              <path d="M20 10 Q10 10 10 25 L10 90 Q10 110 40 110 Q70 110 70 90 L70 25 Q70 10 60 10 Z" fill="#F0F2F5" stroke="#CDD2D8" strokeWidth="1.5"/>
              {/* Dynamic fill level */}
              <clipPath id="bagFillDash">
                <rect x="10" y={10 + (1 - ivRemaining / 500) * 80} width="60" height={ivRemaining / 500 * 80 + 20} />
              </clipPath>
              <path d="M20 10 Q10 10 10 25 L10 90 Q10 110 40 110 Q70 110 70 90 L70 25 Q70 10 60 10 Z" fill="#EBF3FD" clipPath="url(#bagFillDash)"/>
              {/* IV line */}
              <line x1="40" y1="110" x2="40" y2="125" stroke="#CDD2D8" strokeWidth="1.5"/>
              {/* Drip drop — only when valve open */}
              {valveOpen && (
                <ellipse className="drip-drop" cx="40" cy="127" rx="2.5" ry="4" fill="#2C7BE5" opacity="0.7"/>
              )}
              {/* Hanger */}
              <circle cx="40" cy="6" r="4" fill="none" stroke="#CDD2D8" strokeWidth="1.5"/>
              <line x1="40" y1="2" x2="40" y2="0" stroke="#CDD2D8" strokeWidth="1.5"/>
            </svg>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
            Remaining: <strong style={{ fontFamily: 'IBM Plex Mono' }}>{ivRemaining.toFixed(0)} mL</strong>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 3 }}>
            Est. completion: <span style={{ fontFamily: 'IBM Plex Mono' }}>{estHours}h</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Prescribed rate: <span style={{ fontFamily: 'IBM Plex Mono' }}>{selectedPatient?.prescribedRate ?? 45} mL/hr</span>
          </div>
        </div>
      </div>

      {/* ── Row 3: Alerts + Drug + Camera ── */}
      <div className="dash-row-3">
        {/* Alert Log */}
        <div className="card">
          <div className="card-label">Recent Alerts</div>
          {recentAlerts.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>No active alerts.</div>
          ) : (
            recentAlerts.map((a, i) => (
              <div key={a._id || i} className="alert-row">
                <span className={`alert-dot ${!a.acknowledged ? 'unread' : 'read'}`} />
                <div className="alert-desc">{a.message}</div>
                <div className="alert-time">{formatTime(a.timestamp)}</div>
              </div>
            ))
          )}
          <Link to="/alerts" className="alert-link">
            View all alerts →
          </Link>
        </div>

        {/* Drug Impact mini */}
        <div className="card">
          <div className="card-label">Drug Impact Curve</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
            Last infusion — simulated
          </div>
          <ResponsiveContainer width="100%" height={90}>
            <LineChart data={drugData} margin={{ top: 2, right: 0, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
              <XAxis dataKey="t" hide />
              <YAxis hide />
              <Line type="monotone" dataKey="spo2" stroke="#2C7BE5" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="rate" stroke="#52606D" strokeWidth={1} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ borderTop: '1px solid #F0F2F5', marginTop: 8, paddingTop: 8 }}>
            {[
              { label: 'Response onset', val: '8.2 min' },
              { label: 'Peak efficacy', val: '87%' },
              { label: 'Duration', val: '42 min' },
            ].map(({ label, val }) => (
              <div key={label} className="drug-metric-row">
                <span className="drug-metric-label">{label}</span>
                <span className="drug-metric-val">{val}</span>
              </div>
            ))}
          </div>
          <Link to="/drug-report" className="btn-text" style={{ marginTop: 12 }}>
            Full Report →
          </Link>
        </div>

        {/* Live Camera */}
        <div className="card">
          <div className="card-label">Patient Camera — {selectedPatient?.bedNumber ?? 'Bed 4A'}</div>
          <div className="camera-feed-area">
            <div className="live-badge">
              <span className="live-badge-dot" />
              LIVE
            </div>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 7l-7 5 7 5V7z"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            <span className="camera-feed-label">ESP32-CAM feed not connected</span>
          </div>
          <div className="camera-stream-info">Powered by ESP32-CAM + WebRTC</div>
          <div className="blynk-row">
            <span className="blynk-dot" />
            Connect hardware to enable live stream
          </div>
        </div>
      </div>

      {/* ── Row 5: Today's Bottle Sessions ── */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-label" style={{ marginBottom: 12 }}>Today's Bottle Sessions — Rahul Sharma</div>
        <div className="bottle-slots-row">
          {[1, 2, 3].map((n) => {
            const s = bottleSessions.find((x) => x.bottleNumber === n);
            if (!s) {
              return (
                <div key={n} className="bottle-slot not-started">
                  <div className="bottle-slot-num">Bottle {n}</div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Not started</span>
                </div>
              );
            }
            return <BottleSessionRow key={n} session={s} refetch={refetchSessions} vitals={latest} />;
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Row 5: Bottle Session Slot ── */
function sessionElapsed(startTime) {
  if (!startTime) return '—';
  const ms = Date.now() - new Date(startTime).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function AddDrugModal({ sessionId, onClose, onDone }) {
  const [name, setName] = useState('');
  const [dosageMg, setDosageMg] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name) return;
    setSaving(true);
    try {
      await fetch(`${API}/api/sessions/${sessionId}/inject-drug`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, dosageMg: Number(dosageMg), injectedBy: 'Dr. Anjali Mehta' }),
      });
      onDone();
    } catch {
      setSaving(false);
      return;
    }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Add Drug</div>
        <div className="modal-body">
          <label className="modal-label">Drug Name
            <input className="modal-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Paracetamol" />
          </label>
          <label className="modal-label" style={{ marginTop: 12 }}>Dosage (mg)
            <input className="modal-input" type="number" value={dosageMg} onChange={(e) => setDosageMg(e.target.value)} placeholder="e.g. 500" />
          </label>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving || !name}>
            {saving ? 'Injecting...' : 'Inject Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BottleSessionRow({ session, refetch, vitals }) {
  const [showDrug, setShowDrug] = useState(false);
  const [ending, setEnding] = useState(false);
  const id = session?._id?.toString?.() || session?._id;
  const { status, bottleNumber, startTime, drugResponse, drug } = session;

  const latestHr = vitals?.heartRate;
  const latestSpo2 = vitals?.spo2;

  async function handleEnd() {
    setEnding(true);
    try {
      await fetch(`${API}/api/sessions/${id}/end`, { method: 'POST' });
      refetch();
    } catch {
      setEnding(false);
      return;
    }
    setEnding(false);
  }

  if (status === 'completed') {
    const score = drugResponse?.efficacyScore;
    const scoreColor = score >= 70 ? '#27A96C' : score >= 40 ? '#F4A100' : '#D93025';
    return (
      <div className="bottle-slot completed">
        <div className="bottle-slot-num">Bottle {bottleNumber}</div>
        {score != null && (
          <span className="bottle-score-pill" style={{ background: '#E6F6F0', color: scoreColor }}>
            Efficacy {score}% · {drugResponse.responseStatus}
          </span>
        )}
        <Link to={`/patient/rahul-sharma/bottle/${id}`} className="btn-text" style={{ marginLeft: 'auto' }}>View Report →</Link>
      </div>
    );
  }

  if (status === 'ongoing') {
    return (
      <>
        {showDrug && (
          <AddDrugModal sessionId={id} onClose={() => setShowDrug(false)} onDone={() => { setShowDrug(false); refetch(); }} />
        )}
        <div className="bottle-slot ongoing">
          <div className="bottle-slot-num">Bottle {bottleNumber}</div>
          <span className="bottle-elapsed">{sessionElapsed(startTime)}</span>
          {latestHr && <span className="bottle-mini-vital">HR {Math.round(latestHr)}</span>}
          {latestSpo2 && <span className="bottle-mini-vital">SpO₂ {latestSpo2.toFixed(1)}%</span>}
          {!drug?.name && <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowDrug(true)}>Add Drug</button>}
          <button className="btn" style={{ padding: '4px 10px', fontSize: 12, borderColor: '#D93025', color: '#D93025', marginLeft: 4, background: 'none' }} onClick={handleEnd} disabled={ending}>
            {ending ? 'Ending...' : 'End Bottle'}
          </button>
        </div>
      </>
    );
  }

  // Not started
  return (
    <div className="bottle-slot not-started">
      <div className="bottle-slot-num">Bottle {bottleNumber}</div>
      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Not started</span>
    </div>
  );
}
