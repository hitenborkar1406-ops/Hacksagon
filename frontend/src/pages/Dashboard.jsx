import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { generateHistory, MOCK_ALERTS } from '../utils/formatVitals';

/* ── Live-updating sparkline data ── */
function genSparkline(base, range, count = 8) {
  return Array.from({ length: count }, (_, i) => ({
    i,
    v: base + (Math.random() - 0.5) * range,
  }));
}

function generateDrugImpactMini() {
  return Array.from({ length: 20 }, (_, i) => ({
    t: i,
    spo2: 96 + (i < 5 ? 0 : Math.min(2.5, (i - 5) * 0.4 + (Math.random() - 0.5) * 0.2)),
    rate: i < 5 ? 0 : i < 15 ? 45 : Math.max(0, 45 - (i - 15) * 5),
  }));
}

export default function Dashboard() {
  const [hr, setHr] = useState(78);
  const [spo2, setSpo2] = useState(97);
  const [ivInfused] = useState(67);
  const [valveOpen] = useState(true);
  const [hrSpark, setHrSpark] = useState(() => genSparkline(78, 6));
  const [spo2Spark, setSpo2Spark] = useState(() => genSparkline(97, 1.5));
  const [vitalsHistory, setVitalsHistory] = useState(() => generateHistory(30, 78, 97));
  const [drugData] = useState(generateDrugImpactMini);
  const [now, setNow] = useState(new Date());

  const unacked = MOCK_ALERTS.filter(a => !a.acked).length;

  useEffect(() => {
    const tick = setInterval(() => {
      setHr(v => Math.max(55, Math.min(120, v + (Math.random() - 0.5) * 2.5)));
      setSpo2(v => Math.max(92, Math.min(100, v + (Math.random() - 0.5) * 0.5)));
      setHrSpark(prev => [...prev.slice(1), { i: prev.length, v: 78 + (Math.random() - 0.5) * 8 }]);
      setSpo2Spark(prev => [...prev.slice(1), { i: prev.length, v: 97 + (Math.random() - 0.5) * 1.5 }]);
      setVitalsHistory(prev => {
        const last = prev[prev.length - 1];
        return [
          ...prev.slice(1),
          {
            t: last.t + 1,
            hr: Math.max(55, Math.min(120, last.hr + (Math.random() - 0.5) * 2)),
            spo2: Math.max(92, Math.min(100, last.spo2 + (Math.random() - 0.5) * 0.4)),
          },
        ];
      });
      setNow(new Date());
    }, 2000);
    return () => clearInterval(tick);
  }, []);

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="page-body">
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">ICU Dashboard</h1>
          <div className="page-breadcrumb">Ward 3B · Bed 4A — Rahul Sharma · Active monitoring</div>
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
              stroke="#2C7BE5"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
          <span className="status-pill normal">Normal</span>
        </div>

        {/* SpO2 */}
        <div className="card">
          <div className="card-label">Blood Oxygen</div>
          <div>
            <span className="stat-value">{spo2.toFixed(1)}</span>
            <span className="stat-unit">%</span>
          </div>
          <svg className="sparkline-svg" viewBox={`0 0 ${spo2Spark.length * 14} 28`} preserveAspectRatio="none">
            <polyline
              points={spo2Spark.map((d, i) => `${i * 14},${28 - ((d.v - 90) / 10) * 28}`).join(' ')}
              stroke="#2C7BE5"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
          <span className="status-pill normal">Normal</span>
        </div>

        {/* IV Drip Rate */}
        <div className="card">
          <div className="card-label">IV Drip Rate</div>
          <div>
            <span className="stat-value">45</span>
            <span className="stat-unit">mL / hr</span>
          </div>
          <div className="iv-progress-track">
            <div className="iv-progress-fill" style={{ width: `${ivInfused}%` }} />
          </div>
          <div className="iv-caption">{ivInfused}% infused</div>
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
          <div className="card-label">Vitals — Last 30 Minutes</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={vitalsHistory} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
              <XAxis
                dataKey="t"
                tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#8A97A4' }}
                tickLine={false}
                axisLine={{ stroke: '#E2E6EA' }}
                tickFormatter={(v) => `${v}m`}
                interval={5}
              />
              <YAxis
                tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#8A97A4' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #E2E6EA',
                  borderRadius: 6,
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 11,
                }}
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
              <span className="legend-swatch" style={{ background: '#52606D', backgroundImage: 'repeating-linear-gradient(to right, #52606D 0, #52606D 4px, transparent 4px, transparent 8px)' }} /> SpO₂
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
              {/* Fill level — 33% full (67% consumed) */}
              <clipPath id="bagFill">
                <rect x="10" y="73" width="60" height="40" />
              </clipPath>
              <path d="M20 10 Q10 10 10 25 L10 90 Q10 110 40 110 Q70 110 70 90 L70 25 Q70 10 60 10 Z" fill="#EBF3FD" clipPath="url(#bagFill)"/>
              {/* IV line */}
              <line x1="40" y1="110" x2="40" y2="125" stroke="#CDD2D8" strokeWidth="1.5"/>
              {/* Drip drop */}
              <ellipse className="drip-drop" cx="40" cy="127" rx="2.5" ry="4" fill="#2C7BE5" opacity="0.7"/>
              {/* Hanger at top */}
              <circle cx="40" cy="6" r="4" fill="none" stroke="#CDD2D8" strokeWidth="1.5"/>
              <line x1="40" y1="2" x2="40" y2="0" stroke="#CDD2D8" strokeWidth="1.5"/>
            </svg>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
            Remaining: <strong>165 mL</strong>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 3 }}>
            Est. completion: 3h 40m
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Prescribed rate: 45 mL/hr
          </div>
        </div>
      </div>

      {/* ── Row 3: Alerts + Drug + Camera ── */}
      <div className="dash-row-3">
        {/* Alert Log */}
        <div className="card">
          <div className="card-label">Recent Alerts</div>
          <div>
            <div className="alert-row">
              <span className="alert-dot unread" />
              <div className="alert-desc">Backflow detected — valve closed auto</div>
              <div className="alert-time">02:14 AM</div>
            </div>
            <div className="alert-row">
              <span className="alert-dot read" />
              <div className="alert-desc">SpO₂ dropped below 95%</div>
              <div className="alert-time">Yesterday 11:42 PM</div>
            </div>
            <div className="alert-row">
              <span className="alert-dot read" />
              <div className="alert-desc">IV bag below 25% — refill soon</div>
              <div className="alert-time">Yesterday 09:15 PM</div>
            </div>
          </div>
          <Link to="/alerts" className="alert-link">
            View all alerts →
          </Link>
        </div>

        {/* Drug Impact mini */}
        <div className="card">
          <div className="card-label">Drug Impact Curve</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
            Last infusion — 06:30 AM
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
          <div className="card-label">Patient Camera — Bed 4A</div>
          <div className="camera-feed-area">
            <div className="live-badge">
              <span className="live-badge-dot" />
              LIVE
            </div>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 7l-7 5 7 5V7z"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            <span className="camera-feed-label">Feed loading...</span>
          </div>
          <div className="camera-stream-info">Stream via ESP32-CAM</div>
          <div className="blynk-row">
            <span className="blynk-dot" />
            Mobile access: Active
          </div>
        </div>
      </div>
    </div>
  );
}
