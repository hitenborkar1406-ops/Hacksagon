/**
 * BottleReport.jsx
 * /patient/:patientId/bottle/:sessionId — Full bottle detail for family.
 */
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import SessionTimeline from '../../components/patient/SessionTimeline';
import DrugResponseSummary from '../../components/patient/DrugResponseSummary';
import PlanGate from '../../components/patient/PlanGate.jsx';
import PremiumUpgradeCard from '../../components/patient/PremiumUpgradeCard.jsx';
import { usePlan } from '../../hooks/usePlan.js';
import { generateBottleSummary } from '../../utils/insightGenerator';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function fmtTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function durationStr(start, end) {
  if (!start || !end) return '';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function BottleReport() {
  const { patientId = 'rahul-sharma', sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`${API}/api/sessions/${sessionId}/detail`)
      .then((r) => r.json())
      .then((json) => { if (json?.data) setSession(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <div className="patient-page"><div className="patient-loading">Loading report...</div></div>;
  if (!session) return <div className="patient-page"><div className="patient-loading">Session not found.</div></div>;

  const { isBasic } = usePlan();
  const summary = generateBottleSummary({ ...session, patientName: 'Rahul' });

  return (
    <div className="patient-page">
      <div className="patient-page-back">
        <Link to={`/patient/${patientId}/today`} className="btn-text">← Back to Today</Link>
      </div>

      {/* Header */}
      <div className="patient-header">
        <div className="patient-name-large" style={{ fontSize: 20 }}>
          Bottle {session.bottleNumber} · {fmtDate(session.startTime)}
        </div>
        <div className="patient-info-sub">
          {fmtTime(session.startTime)} – {fmtTime(session.endTime)} · Duration: {durationStr(session.startTime, session.endTime)}
        </div>
        <span className={`status-pill-inline ${session.status}`}>{session.status === 'completed' ? 'Completed' : 'Ongoing'}</span>
      </div>

      {/* Vitals Chart */}
      <div className="patient-section">
        <div className="patient-section-title">How Rahul's body responded during this bottle</div>
        <SessionTimeline session={session} />
        {summary && <div className="bottle-summary-text">{summary}</div>}
      </div>

      {/* Medication Response */}
      <PlanGate
        requiredPlan="premium"
        fallback={
          <div className="patient-section">
            <div className="patient-section-title">Medication</div>
            <div className="bottle-card-no-drug">Medication was administered during this session.</div>
            <PremiumUpgradeCard message="Full drug response details are available on the Premium Plan. Ask your doctor to upgrade your access." />
          </div>
        }
      >
        {session.drug?.name && session.drug.name !== 'null' && (
          <div className="patient-section">
            <div className="patient-section-title">Medication Response</div>
            <DrugResponseSummary session={session} />
          </div>
        )}
      </PlanGate>

      {/* Doctor's Notes */}
      <PlanGate requiredPlan="premium">
        {session.doctorNotes && (
          <div className="patient-section">
            <div className="doctor-notes-card">
              <div className="doctor-notes-header">
                <span className="doctor-notes-icon">🩺</span>
                <span className="doctor-notes-title">Doctor's Notes</span>
              </div>
              <div className="doctor-notes-body">{session.doctorNotes}</div>
              {session.drug?.injectedBy && (
                <div className="doctor-notes-by">Added by {session.drug.injectedBy}</div>
              )}
            </div>
          </div>
        )}
      </PlanGate>

      <div className="patient-section">
        <Link to={`/patient/${patientId}/export`} className="btn btn-ghost">Export This Report</Link>
      </div>
    </div>
  );
}
