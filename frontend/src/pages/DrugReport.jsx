import { useState } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Legend,
} from 'recharts';
import { generateDrugImpact } from '../utils/formatVitals';

/* Generate SpO2 vs IV Rate data for the full drug report chart */
function generateFullDrugReport() {
  return Array.from({ length: 121 }, (_, i) => {
    const t = i - 30; // T-30 to T+90 minutes
    let ivRate = 0;
    if (t < 0) ivRate = 0;
    else if (t < 5) ivRate = t * 9;
    else if (t < 60) ivRate = 45;
    else ivRate = Math.max(0, 45 - (t - 60) * 3);

    let spo2 = 96;
    if (t >= 0 && t < 8) spo2 = 96 - t * 0.1;
    else if (t >= 8 && t < 22) spo2 = 95.2 + (t - 8) * 0.235;
    else if (t >= 22) spo2 = Math.min(98.5, 98.5 - Math.max(0, (t - 45)) * 0.02);

    return { t, ivRate, spo2: parseFloat(spo2.toFixed(2)) };
  });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E6EA', borderRadius: 6, padding: '8px 12px', fontFamily: 'IBM Plex Mono', fontSize: 11 }}>
      <div style={{ color: '#8A97A4', marginBottom: 4 }}>
        {label >= 0 ? `T+${label} min` : `T${label} min`}
      </div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {Number(p.value).toFixed(1)}
          {p.dataKey === 'spo2' ? '%' : ' mL/hr'}
        </div>
      ))}
    </div>
  );
}

export default function DrugReport() {
  const [chartData] = useState(generateFullDrugReport);

  return (
    <div className="page-body">
      {/* ── Header ── */}
      <div className="drug-report-header">
        <div>
          <h1 className="page-title">Drug Response Report</h1>
          <div className="drug-report-subtitle">
            Rahul Sharma · Bed 4A · Infusion event: 06:30 AM, today
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            Drug: Furosemide 40mg IV · Administered by Dr. Mehta
          </div>
        </div>
        <button className="btn-outlined">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1v10M4 7l4 4 4-4M2 14h12" /></svg>
          Download PDF
        </button>
      </div>

      {/* ── Main chart card ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-label">Drug Impact Curve — SpO₂ vs IV Rate</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Time axis: T−30 min (pre-infusion baseline) to T+90 min post-administration
        </div>

        <ResponsiveContainer width="100%" height={420}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 40, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F4F6F8" />

            <XAxis
              dataKey="t"
              tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#8A97A4' }}
              tickLine={false}
              axisLine={{ stroke: '#E2E6EA' }}
              tickFormatter={v => v === 0 ? 'T+0' : v > 0 ? `+${v}m` : `${v}m`}
              interval={14}
            />

            {/* Left Y: SpO2 */}
            <YAxis
              yAxisId="spo2"
              domain={[92, 100]}
              tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#8A97A4' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${v}%`}
            />

            {/* Right Y: IV Rate */}
            <YAxis
              yAxisId="iv"
              orientation="right"
              domain={[0, 80]}
              tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#8A97A4' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${v} mL`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Peak efficacy shaded zone */}
            <ReferenceArea
              yAxisId="spo2"
              x1={10} x2={35}
              fill="rgba(44,123,229,0.06)"
              label={{ value: 'Peak efficacy zone', fill: '#1A4F9C', fontSize: 10, fontFamily: 'IBM Plex Mono', position: 'insideTop' }}
            />

            {/* T=0 drug administered */}
            <ReferenceLine
              yAxisId="spo2"
              x={0}
              stroke="#CDD2D8"
              strokeDasharray="4 3"
              strokeWidth={1}
              label={{ value: 'Drug administered', fill: '#52606D', fontSize: 10, fontFamily: 'IBM Plex Mono', position: 'insideTopRight' }}
            />

            {/* T=8 response onset */}
            <ReferenceLine
              yAxisId="spo2"
              x={8}
              stroke="#2C7BE5"
              strokeDasharray="4 3"
              strokeWidth={1}
              label={{ value: 'Onset: 8.2m', fill: '#1A4F9C', fontSize: 10, fontFamily: 'IBM Plex Mono', position: 'insideTopRight' }}
            />

            {/* T=60 stabilised */}
            <ReferenceLine
              yAxisId="spo2"
              x={60}
              stroke="#CDD2D8"
              strokeDasharray="4 3"
              strokeWidth={1}
              label={{ value: 'Stabilised', fill: '#52606D', fontSize: 10, fontFamily: 'IBM Plex Mono', position: 'insideTopRight' }}
            />

            {/* IV Rate — grey dashed */}
            <Line
              yAxisId="iv"
              type="monotone"
              dataKey="ivRate"
              stroke="#52606D"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              name="IV Rate"
              isAnimationActive={false}
            />

            {/* SpO2 — blue solid */}
            <Line
              yAxisId="spo2"
              type="monotone"
              dataKey="spo2"
              stroke="#2C7BE5"
              strokeWidth={2}
              dot={false}
              name="SpO₂"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="chart-legend" style={{ marginTop: 16 }}>
          <span className="legend-pill"><span className="legend-swatch" style={{ background: '#2C7BE5' }} /> SpO₂ Response (%)</span>
          <span className="legend-pill"><span className="legend-swatch" style={{ background: '#52606D' }} /> IV Infusion Rate (mL/hr)</span>
        </div>
      </div>

      {/* ── Metrics grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        {[
          { label: 'Response Onset', val: '8.2', unit: 'min' },
          { label: 'Peak SpO₂', val: '98.5', unit: '%' },
          { label: 'Peak Efficacy', val: '87', unit: '%' },
          { label: 'Duration', val: '42', unit: 'min' },
        ].map(({ label, val, unit }) => (
          <div key={label} className="card" style={{ padding: '16px 20px' }}>
            <div className="card-label">{label}</div>
            <div>
              <span className="data-value">{val}</span>
              <span className="data-unit"> {unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Infusion log ── */}
      <div className="card">
        <div className="card-label">Infusion Event Log</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Time', 'Event', 'SpO₂', 'IV Rate', 'Clinician'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'IBM Plex Mono', fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { time: '06:00 AM', event: 'Baseline recorded', spo2: '96.0%', rate: '0 mL/hr', dr: 'Dr. Mehta' },
                { time: '06:30 AM', event: 'Furosemide 40mg administered', spo2: '95.8%', rate: '45 mL/hr', dr: 'Dr. Mehta' },
                { time: '06:38 AM', event: 'Response onset detected', spo2: '96.5%', rate: '45 mL/hr', dr: 'Auto' },
                { time: '06:52 AM', event: 'Peak efficacy reached', spo2: '98.5%', rate: '45 mL/hr', dr: 'Auto' },
                { time: '07:30 AM', event: 'Infusion tapered', spo2: '98.2%', rate: '18 mL/hr', dr: 'Dr. Mehta' },
                { time: '08:00 AM', event: 'Patient stabilised', spo2: '97.8%', rate: '0 mL/hr', dr: 'Dr. Mehta' },
              ].map(({ time, event, spo2, rate, dr }) => (
                <tr key={time} style={{ borderBottom: '1px solid var(--bg-surface-alt)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'IBM Plex Mono', fontSize: 11, color: 'var(--text-muted)' }}>{time}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>{event}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'var(--blue-dark)' }}>{spo2}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'var(--text-secondary)' }}>{rate}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{dr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
