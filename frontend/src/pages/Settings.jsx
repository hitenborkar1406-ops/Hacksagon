import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { MOCK_PATIENTS } from '../utils/formatVitals';

const defaultThresholds = {
  spo2Low: 90,
  hrHigh: 120,
  hrLow: 50,
  flowDeviation: 15,
};

export default function Settings() {
  const [selected, setSelected] = useState(MOCK_PATIENTS[0].patientId);
  const [thresholds, setThresholds] = useState(defaultThresholds);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleChange(key, val) {
    setThresholds((prev) => ({ ...prev, [key]: Number(val) }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/settings/${selected}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thresholds),
      });
    } catch { /* mock */ }
    setTimeout(() => { setSaving(false); setSaved(true); }, 800);
  }

  const patient = MOCK_PATIENTS.find((p) => p.patientId === selected);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopBar title="SETTINGS" />
        <div className="page-body">
          <div className="page-header">
            <div>
              <div className="page-heading">THRESHOLD CONFIGURATION</div>
              <div className="page-subhead">Per-patient alert thresholds · Saved to MongoDB</div>
            </div>
          </div>

          {/* Patient selector */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">SELECT PATIENT</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MOCK_PATIENTS.map((p) => (
                <button
                  key={p.patientId}
                  onClick={() => { setSelected(p.patientId); setSaved(false); }}
                  style={{
                    fontFamily: 'var(--mono)', fontSize: 11, padding: '7px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: p.patientId === selected ? '1px solid rgba(0,212,255,0.4)' : '1px solid var(--border)',
                    background: p.patientId === selected ? 'rgba(0,212,255,0.08)' : 'var(--bg-panel)',
                    color: p.patientId === selected ? 'var(--accent-teal)' : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all var(--transition)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {p.patientId} · {p.room}
                </button>
              ))}
            </div>
          </div>

          {patient && (
            <div className="settings-grid">
              {/* Vital thresholds */}
              <div className="settings-card">
                <div className="settings-card-title">VITAL ALERT THRESHOLDS</div>
                <div className="settings-card-sub">{patient.name} · {patient.room} · {patient.drug}</div>

                <div className="threshold-row">
                  <div className="threshold-label">SpO₂ ALERT BELOW</div>
                  <input className="threshold-input" type="number" min={70} max={99} value={thresholds.spo2Low} onChange={(e) => handleChange('spo2Low', e.target.value)} />
                  <div className="threshold-unit">%</div>
                </div>
                <div className="threshold-row">
                  <div className="threshold-label">HR UPPER LIMIT</div>
                  <input className="threshold-input" type="number" min={60} max={200} value={thresholds.hrHigh} onChange={(e) => handleChange('hrHigh', e.target.value)} />
                  <div className="threshold-unit">BPM</div>
                </div>
                <div className="threshold-row">
                  <div className="threshold-label">HR LOWER LIMIT</div>
                  <input className="threshold-input" type="number" min={20} max={80} value={thresholds.hrLow} onChange={(e) => handleChange('hrLow', e.target.value)} />
                  <div className="threshold-unit">BPM</div>
                </div>
                <div className="threshold-row">
                  <div className="threshold-label">IV FLOW DEVIATION</div>
                  <input className="threshold-input" type="number" min={1} max={50} value={thresholds.flowDeviation} onChange={(e) => handleChange('flowDeviation', e.target.value)} />
                  <div className="threshold-unit">%</div>
                </div>

                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? 'SAVING...' : 'SAVE THRESHOLDS'}
                </button>
                {saved && <div className="save-success">✓ Thresholds saved to {patient.patientId}</div>}
              </div>

              {/* Preview */}
              <div className="settings-card">
                <div className="settings-card-title">THRESHOLD PREVIEW</div>
                <div className="settings-card-sub">How alerts will fire for this patient</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  {[
                    { label: `SpO₂ < ${thresholds.spo2Low}%`, color: 'var(--accent-red)', level: 'CRITICAL' },
                    { label: `HR > ${thresholds.hrHigh} BPM`, color: 'var(--accent-yellow)', level: 'WARNING' },
                    { label: `HR < ${thresholds.hrLow} BPM`, color: 'var(--accent-yellow)', level: 'WARNING' },
                    { label: `IV FLOW = 0 mL/hr`, color: 'var(--accent-red)', level: 'CRITICAL' },
                    { label: `BACKFLOW DETECTED`, color: 'var(--accent-red)', level: 'CRITICAL' },
                    { label: `BOTTLE LEVEL < 15%`, color: 'var(--accent-yellow)', level: 'WARNING' },
                  ].map((t) => (
                    <div key={t.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)' }}>{t.label}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: t.color, padding: '2px 8px', border: `1px solid ${t.color}40`, background: `${t.color}10`, borderRadius: 20 }}>{t.level}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* System config */}
              <div className="settings-card" style={{ gridColumn: '1 / -1' }}>
                <div className="settings-card-title">SYSTEM CONFIGURATION</div>
                <div className="settings-card-sub">Global settings — affects all patients</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 8 }}>
                  {[
                    { label: 'SOCKET.IO SERVER', val: 'localhost:3001', editable: false },
                    { label: 'AI SERVICE', val: 'localhost:8000', editable: false },
                    { label: 'MQTT BROKER', val: 'localhost:1883', editable: false },
                    { label: 'DATA RETENTION', val: '30 days', editable: false },
                    { label: 'ALERT CHANNELS', val: 'Dashboard · Mobile · Buzzer', editable: false },
                    { label: 'AI PROCESSING', val: 'Server-side only', editable: false },
                  ].map((s) => (
                    <div key={s.label} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent-teal)' }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
