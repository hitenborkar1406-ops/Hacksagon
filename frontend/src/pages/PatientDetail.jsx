import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import VitalsChart from '../components/VitalsChart';
import DrugImpactChart from '../components/DrugImpactChart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MOCK_PATIENTS, generateHistory, generateDrugImpact, fmtHR, fmtSpO2, fmtFlow, statusColor } from '../utils/formatVitals';
import { ArrowLeft } from 'lucide-react';

export default function PatientDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const patient = MOCK_PATIENTS.find((p) => p.patientId === id) || MOCK_PATIENTS[0];

  const [liveVitals, setLiveVitals] = useState({ hr: patient.hr, spo2: patient.spo2, ivFlow: patient.ivFlow, valve: patient.valve, backflow: patient.backflow });
  const [history, setHistory] = useState(() => generateHistory(60, patient.hr, patient.spo2));
  const [drugData] = useState(generateDrugImpact);
  const [flowRate, setFlowRate] = useState(patient.ivFlow);
  const [valve, setValve] = useState(patient.valve);
  const [saving, setSaving] = useState(false);

  // Simulate live updates
  useEffect(() => {
    const tick = setInterval(() => {
      setLiveVitals((prev) => {
        const next = {
          hr: Math.max(40, Math.min(180, prev.hr + (Math.random() - 0.5) * 3)),
          spo2: Math.max(80, Math.min(100, prev.spo2 + (Math.random() - 0.5) * 0.6)),
          ivFlow: flowRate,
          valve,
          backflow: prev.backflow,
        };
        setHistory((h) => {
          const upd = [...h.slice(1), { t: h[h.length - 1].t + 1, hr: next.hr, spo2: next.spo2, ivFlow: next.ivFlow }];
          return upd;
        });
        return next;
      });
    }, 1500);
    return () => clearInterval(tick);
  }, [flowRate, valve]);

  async function toggleValve() {
    const newState = valve === 'OPEN' ? 'CLOSED' : 'OPEN';
    setSaving(true);
    try {
      await fetch('/api/control/valve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: id, state: newState }),
      });
    } catch { /* mock */ }
    setValve(newState);
    setSaving(false);
  }

  async function adjustFlow(delta) {
    const newRate = Math.max(0, Math.min(200, flowRate + delta));
    setFlowRate(newRate);
    try {
      await fetch('/api/control/flow', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: id, rate: newRate }),
      });
    } catch { /* mock */ }
  }

  const sc = statusColor(patient.status);
  const hrClass = liveVitals.hr > 100 || liveVitals.hr < 50 ? 'red' : liveVitals.hr > 90 ? 'yellow' : 'green';
  const spo2Class = liveVitals.spo2 < 90 ? 'red' : liveVitals.spo2 < 94 ? 'yellow' : 'green';

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopBar title={`PATIENT DETAIL — ${id}`} />
        <div className="page-body">

          {/* Back + Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button className="btn-back" onClick={() => nav(-1)}>
              <ArrowLeft size={12} /> BACK
            </button>
          </div>

          <div className="patient-detail-header">
            <div className="pd-meta">
              <div className="pd-title-row">
                <div className="pd-patient-id mono">{patient.patientId}</div>
                <div className={`status-pill ${sc.replace('status-', '')}`}>
                  <span className="status-dot-sm" />
                  {patient.status}
                </div>
              </div>
              <div className="pd-name">{patient.name}</div>
              <div className="pd-tags">
                <span className="pd-tag">{patient.room}</span>
                <span className="pd-tag">{patient.doctor}</span>
                <span className="pd-tag">{patient.drug}</span>
                <span className="pd-tag">MAX30102 · IR Sensor · ESP32</span>
              </div>
            </div>

            <div className="pd-controls">
              <div className="control-row">
                <span className="control-label">SOLENOID VALVE</span>
                <button
                  className={`valve-toggle-btn ${valve.toLowerCase()}`}
                  onClick={toggleValve}
                  disabled={saving}
                >
                  {valve} {saving ? '...' : '⇄'}
                </button>
              </div>
              <div className="control-row">
                <span className="control-label">IV FLOW RATE</span>
                <div className="flow-control">
                  <button className="flow-btn" onClick={() => adjustFlow(-5)}>−</button>
                  <div className="flow-value mono">{flowRate.toFixed(0)} mL/hr</div>
                  <button className="flow-btn" onClick={() => adjustFlow(+5)}>+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Row 1: Live vitals big + backflow */}
          <div className="pd-grid-row pd-row-3">
            {/* Big HR */}
            <div className="card scanlines">
              <div className="card-title">HEART RATE</div>
              <div className="vital-big">
                <div className="vital-big-label">BPM</div>
                <div className={`vital-big-val ${hrClass}`}>
                  <span className="vital-big-hr">{fmtHR(liveVitals.hr)}</span>
                </div>
                <div className="vital-big-unit">beats per minute</div>
              </div>
              {/* Mini ECG */}
              <div style={{ height: 40, marginTop: 8 }}>
                <svg viewBox="0 0 200 40" style={{ width: '100%', height: '100%' }}>
                  <path d="M0,20 L30,20 L35,20 L38,4 L42,36 L46,2 L50,32 L54,20 L80,20 L85,20 L88,4 L92,36 L96,2 L100,32 L104,20 L130,20 L135,20 L138,4 L142,36 L146,2 L150,32 L154,20 L180,20 L185,20 L188,4 L192,36 L196,2 L200,20" stroke="#00d4ff" strokeWidth="1.5" fill="none" opacity="0.8" />
                </svg>
              </div>
            </div>

            {/* Big SpO2 */}
            <div className="card scanlines">
              <div className="card-title">SpO₂ SATURATION</div>
              <div className="vital-big">
                <div className="vital-big-label">%</div>
                <div className={`vital-big-val ${spo2Class}`}>{fmtSpO2(liveVitals.spo2)}</div>
                <div className="vital-big-unit">oxygen saturation</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ width: 6, height: 6 + i * 3, borderRadius: 2, background: liveVitals.spo2 > 90 ? 'var(--accent-green)' : 'var(--accent-red)', opacity: 0.6 + i * 0.08 }} />
                ))}
              </div>
            </div>

            {/* Backflow */}
            <div className="card">
              <div className="card-title">BACKFLOW STATUS</div>
              <div className="backflow-indicator">
                <div className={`backflow-led ${liveVitals.backflow ? 'danger' : 'safe'}`}>
                  {liveVitals.backflow ? '🩸' : '✓'}
                </div>
                <div className={`backflow-text ${liveVitals.backflow ? 'danger' : 'safe'}`}>
                  {liveVitals.backflow ? 'BACKFLOW DETECTED\nSOLENOID CLOSED' : 'NO BACKFLOW\nLINE CLEAR'}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                  IV FLOW: {fmtFlow(liveVitals.ivFlow)} mL/hr<br />
                  VALVE: {valve}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Vitals chart + IV Flow chart */}
          <div className="pd-grid-row pd-row-2">
            <div className="card">
              <div className="card-title">VITALS — HR + SpO₂ (LAST 60s)</div>
              <VitalsChart data={history} />
            </div>

            <div className="card">
              <div className="card-title">IV FLOW RATE (mL/hr)</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={history} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="t" tick={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fill: 'var(--text-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} tickFormatter={(v) => `${v}s`} interval={14} />
                  <YAxis tick={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', fontFamily: 'IBM Plex Mono', fontSize: 11 }} />
                  <ReferenceLine y={80} stroke="var(--accent-red)" strokeDasharray="4 4" strokeWidth={1} label={{ value: 'MAX', fill: 'var(--accent-red)', fontFamily: 'IBM Plex Mono', fontSize: 9 }} />
                  <Area type="monotone" dataKey="ivFlow" stroke="#00ff88" strokeWidth={2} fill="rgba(0,255,136,0.1)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 3: Drug Impact */}
          <div className="card">
            <div className="card-title">DRUG IMPACT CURVE — AI ANALYSIS</div>
            <DrugImpactChart data={drugData} drug={patient.drug} responseDelay="5m 35s" effectiveness={87} />
          </div>

        </div>
      </div>
    </div>
  );
}
