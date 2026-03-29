/**
 * SessionTimeline.jsx
 * Annotated Recharts vitals chart for a single bottle session.
 * Shown in BottleReport with plain-English annotations.
 */
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

function fmtTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function SessionTimeline({ session }) {
  if (!session) return null;
  const { vitalsTimeline = [], drug, drugResponse } = session;
  if (!vitalsTimeline.length) {
    return <div className="timeline-empty">No vitals recorded for this session yet.</div>;
  }

  const data = vitalsTimeline.map((v, i) => ({
    i,
    hr: parseFloat(v.heartRate?.toFixed(1) ?? 0),
    spo2: parseFloat(v.spo2?.toFixed(1) ?? 0),
    ts: v.timestamp,
  }));

  // Calculate reference indices
  const drugTime = drug?.injectedAt ? new Date(drug.injectedAt).getTime() : null;
  const responseOnset = drugResponse?.responseOnsetMinutes;

  function tsToIdx(ms) {
    if (!ms) return null;
    let closest = 0;
    let minDiff = Infinity;
    data.forEach((d, i) => {
      const diff = Math.abs(new Date(d.ts).getTime() - ms);
      if (diff < minDiff) { minDiff = diff; closest = i; }
    });
    return closest;
  }

  const drugIdx = drugTime ? tsToIdx(drugTime) : null;
  const onsetIdx = (drugTime && responseOnset)
    ? tsToIdx(drugTime + responseOnset * 60000)
    : null;

  return (
    <div className="session-timeline-wrap">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
          <XAxis
            dataKey="i"
            tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#8A97A4' }}
            tickLine={false}
            axisLine={{ stroke: '#E2E6EA' }}
            tickFormatter={(v) => {
              const d = data[v];
              return d ? fmtTime(d.ts) : '';
            }}
            interval={Math.floor(data.length / 6)}
          />
          <YAxis tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#8A97A4' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #E2E6EA', borderRadius: 6, fontFamily: 'IBM Plex Mono', fontSize: 11 }}
            labelFormatter={(v) => fmtTime(data[v]?.ts)}
            formatter={(val, name) => [val, name === 'hr' ? 'Heart Rate (BPM)' : 'SpO₂ (%)']}
          />
          {drugIdx != null && (
            <ReferenceLine x={drugIdx} stroke="#F4A100" strokeDasharray="4 3" label={{ value: 'Medication added', position: 'top', fill: '#F4A100', fontSize: 10 }} />
          )}
          {onsetIdx != null && (
            <ReferenceLine x={onsetIdx} stroke="#27A96C" strokeDasharray="4 3" label={{ value: 'Body began responding', position: 'top', fill: '#27A96C', fontSize: 10 }} />
          )}
          <Line type="monotone" dataKey="hr" stroke="#2C7BE5" strokeWidth={1.5} dot={false} name="hr" isAnimationActive={false} />
          <Line type="monotone" dataKey="spo2" stroke="#52606D" strokeWidth={1} strokeDasharray="5 3" dot={false} name="spo2" isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="chart-legend">
        <span className="legend-pill"><span className="legend-swatch" style={{ background: '#2C7BE5' }} /> Heart Rate</span>
        <span className="legend-pill"><span className="legend-swatch" style={{ background: '#52606D' }} /> SpO₂</span>
        {drugIdx != null && <span className="legend-pill"><span className="legend-swatch" style={{ background: '#F4A100' }} /> Medication</span>}
      </div>
    </div>
  );
}
