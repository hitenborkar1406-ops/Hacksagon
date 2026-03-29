import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { usePatientContext } from '../context/PatientContext.jsx';
import { useVitals } from '../hooks/useVitals.js';

export default function Vitals() {
  const { selectedPatientId, selectedPatient } = usePatientContext();
  const { vitals, latest, loading } = useVitals(selectedPatientId);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fall back to animated mock when no live data yet
  const [mockHr, setMockHr] = useState(78);
  const [mockSpo2, setMockSpo2] = useState(97.2);
  const [mockHistory, setMockHistory] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      t: i,
      hr: 78 + Math.sin(i * 0.3) * 8 + (Math.random() - 0.5) * 4,
      spo2: Math.min(100, 97 + Math.sin(i * 0.15) * 2 + (Math.random() - 0.5) * 0.8),
    }))
  );

  useEffect(() => {
    if (vitals.length > 0) return; // real data available — stop mock
    const tick = setInterval(() => {
      setMockHr(v => Math.max(50, Math.min(130, v + (Math.random() - 0.5) * 3)));
      setMockSpo2(v => Math.max(90, Math.min(100, v + (Math.random() - 0.5) * 0.5)));
      setMockHistory(prev => {
        const last = prev[prev.length - 1];
        return [...prev.slice(1), {
          t: last.t + 1,
          hr: Math.max(50, Math.min(130, last.hr + (Math.random() - 0.5) * 2.5)),
          spo2: Math.max(90, Math.min(100, last.spo2 + (Math.random() - 0.5) * 0.4)),
        }];
      });
    }, 1500);
    return () => clearInterval(tick);
  }, [vitals.length]);

  const hr    = latest?.heartRate ?? mockHr;
  const spo2  = latest?.spo2      ?? mockSpo2;

  const history = vitals.length >= 2
    ? vitals.map((v, i) => ({ t: i, hr: v.heartRate, spo2: v.spo2 }))
    : mockHistory;

  const hrStatus   = hr > 100 || hr < 55 ? 'danger' : hr > 90 ? 'warning' : 'normal';
  const spo2Status = spo2 < 92 ? 'danger' : spo2 < 95 ? 'warning' : 'normal';

  const last10 = [...history].slice(-10).reverse();

  // Derived stats
  const hrs   = history.map(v => v.hr);
  const spo2s = history.map(v => v.spo2);
  const avg   = arr => (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(0);
  const peak  = arr => Math.max(...arr).toFixed(0);
  const min   = arr => Math.min(...arr).toFixed(1);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vitals Monitor</h1>
          <div className="page-breadcrumb">
            {selectedPatient
              ? `${selectedPatient.name} · ${selectedPatient.bedNumber} · MAX30102 + IR Sensor`
              : 'Loading patient...'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="page-timestamp">{now.toLocaleTimeString()}</div>
          <div className="live-indicator" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
            <span className="live-dot" /> LIVE
          </div>
        </div>
      </div>

      {/* Big vitals */}
      <div className="vitals-big-grid">
        {/* Heart Rate */}
        <div className="card">
          <div className="card-label">Heart Rate</div>
          <div>
            <span className="vital-big-val" style={{
              color: hrStatus === 'danger' ? 'var(--red)' : hrStatus === 'warning' ? 'var(--amber)' : 'var(--text-primary)'
            }}>
              {Math.round(hr)}
            </span>
            <span className="vital-unit">BPM</span>
          </div>
          <div className="vital-range">Normal range: 55–100 BPM</div>
          <span className={`status-pill ${hrStatus}`} style={{ marginTop: 10 }}>
            {hrStatus === 'normal' ? 'Normal' : hrStatus === 'warning' ? 'Elevated' : 'Abnormal'}
          </span>
          <svg className="ecg-line" viewBox="0 0 300 48" preserveAspectRatio="none">
            <path
              d="M0,24 L40,24 L45,24 L50,4 L56,44 L62,2 L68,38 L74,24 L110,24 L115,24 L120,4 L126,44 L132,2 L138,38 L144,24 L180,24 L185,24 L190,4 L196,44 L202,2 L208,38 L214,24 L250,24 L255,24 L260,4 L266,44 L272,2 L278,38 L284,24 L300,24"
              stroke="#2C7BE5" strokeWidth="1.5" fill="none" opacity="0.7"
            />
          </svg>
        </div>

        {/* SpO2 */}
        <div className="card">
          <div className="card-label">Blood Oxygen (SpO₂)</div>
          <div>
            <span className="vital-big-val" style={{
              color: spo2Status === 'danger' ? 'var(--red)' : spo2Status === 'warning' ? 'var(--amber)' : 'var(--text-primary)'
            }}>
              {spo2.toFixed(1)}
            </span>
            <span className="vital-unit">%</span>
          </div>
          <div className="vital-range">Normal range: 95–100%</div>
          <span className={`status-pill ${spo2Status}`} style={{ marginTop: 10 }}>
            {spo2Status === 'normal' ? 'Normal' : spo2Status === 'warning' ? 'Watch' : 'Low — Alert'}
          </span>
          <div style={{ display: 'flex', gap: 4, marginTop: 16, alignItems: 'flex-end' }}>
            {[6, 9, 12, 15, 18].map((h, i) => (
              <div key={i} style={{
                width: 12, height: h, borderRadius: 2,
                background: spo2 > 95 ? '#2C7BE5' : spo2 > 90 ? '#F4A100' : '#D93025',
                opacity: 0.5 + i * 0.1,
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Dual-line chart */}
      <div className="card vitals-chart-card">
        <div className="card-label">Vitals Trend — Last 30 Readings</div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={history} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
            <XAxis
              dataKey="t"
              tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#8A97A4' }}
              tickLine={false}
              axisLine={{ stroke: '#E2E6EA' }}
              interval={5}
            />
            <YAxis yAxisId="hr" tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#8A97A4' }} tickLine={false} axisLine={false} domain={[40, 140]} />
            <YAxis yAxisId="spo2" orientation="right" tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#8A97A4' }} tickLine={false} axisLine={false} domain={[88, 102]} />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E6EA', borderRadius: 6, fontFamily: 'IBM Plex Mono', fontSize: 11 }} />
            <ReferenceLine yAxisId="hr"   y={100} stroke="#D93025" strokeDasharray="4 3" strokeWidth={1} label={{ value: 'HR Max', fill: '#D93025', fontFamily: 'IBM Plex Mono', fontSize: 9, position: 'right' }}/>
            <ReferenceLine yAxisId="spo2" y={95}  stroke="#F4A100" strokeDasharray="4 3" strokeWidth={1} label={{ value: 'SpO₂ Min', fill: '#F4A100', fontFamily: 'IBM Plex Mono', fontSize: 9, position: 'right' }}/>
            <Line yAxisId="hr"   type="monotone" dataKey="hr"   stroke="#2C7BE5" strokeWidth={1.5} dot={false} name="HR (BPM)" isAnimationActive={false}/>
            <Line yAxisId="spo2" type="monotone" dataKey="spo2" stroke="#52606D" strokeWidth={1} strokeDasharray="5 3" dot={false} name="SpO₂ %" isAnimationActive={false}/>
          </LineChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <span className="legend-pill"><span className="legend-swatch" style={{ background: '#2C7BE5' }} /> Heart Rate</span>
          <span className="legend-pill"><span className="legend-swatch" style={{ background: '#52606D' }} /> SpO₂</span>
        </div>
      </div>

      {/* Stats summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        {[
          { label: 'HR Average',  val: avg(hrs) + ' BPM' },
          { label: 'HR Peak',     val: peak(hrs) + ' BPM' },
          { label: 'SpO₂ Average',val: avg(spo2s) + ' %' },
          { label: 'SpO₂ Min',   val: min(spo2s) + ' %' },
        ].map(({ label, val }) => (
          <div key={label} className="card" style={{ padding: '16px 20px' }}>
            <div className="card-label">{label}</div>
            <div className="data-value">{val.split(' ')[0]}</div>
            <div className="data-unit">{val.split(' ').slice(1).join(' ')}</div>
          </div>
        ))}
      </div>

      {/* Last 10 readings table */}
      <div className="card">
        <div className="card-label">Last 10 Readings</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['#', 'Timestamp', 'Heart Rate', 'SpO₂'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'IBM Plex Mono', fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {last10.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#FAFAFA' : '#FFFFFF', borderBottom: '1px solid #F0F2F5' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'IBM Plex Mono', fontSize: 11, color: 'var(--text-muted)' }}>{last10.length - i}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'IBM Plex Mono', fontSize: 11, color: 'var(--text-muted)' }}>
                    {row.ts ? new Date(row.ts).toLocaleTimeString() : `T-${last10.length - 1 - i}s`}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'var(--blue-dark)' }}>{Math.round(row.hr)} BPM</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'var(--text-primary)' }}>{Number(row.spo2).toFixed(1)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
