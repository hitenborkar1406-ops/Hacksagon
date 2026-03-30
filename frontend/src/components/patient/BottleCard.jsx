/**
 * BottleCard.jsx
 * Single bottle session card for patient/family view.
 */
import { Link } from 'react-router-dom';
import { efficacyText, efficacyColor } from '../../utils/insightGenerator';

function CircleNumber({ number, status }) {
  const cls = status === 'completed' ? 'bottle-circle completed'
    : status === 'ongoing' ? 'bottle-circle ongoing'
    : 'bottle-circle upcoming';

  return (
    <div className={cls}>
      {status === 'completed' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <span>{number}</span>
      )}
      {status === 'ongoing' && <span className="bottle-pulse-dot" />}
    </div>
  );
}

function EffectivenessBar({ score }) {
  const color = efficacyColor(score);
  return (
    <div className="effectiveness-bar-wrap">
      <div className="effectiveness-bar-label">Treatment Effectiveness</div>
      <div className="effectiveness-bar-track">
        <div
          className={`effectiveness-bar-fill ${color}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <div className="effectiveness-bar-pct">{score}%</div>
    </div>
  );
}

function formatTimeRange(start, end) {
  const fmt = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null;
  const s = fmt(start);
  const e = fmt(end);
  if (s && e) return `Started ${s} · Completed ${e}`;
  if (s) return `Started ${s}`;
  return '';
}

export default function BottleCard({ session, patientId, isPremium = false }) {
  if (!session) return null;
  const { _id, bottleNumber, status, startTime, endTime, drug, drugResponse } = session;
  const id = _id?.toString?.() || _id;
  const hasDrug = drug?.name && drug.name !== 'null';
  const score = drugResponse?.efficacyScore;
  const injectedAt = drug?.injectedAt
    ? new Date(drug.injectedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={`bottle-card ${status}`}>
      <CircleNumber number={bottleNumber} status={status} />
      <div className="bottle-card-body">
        <div className="bottle-card-title">Bottle {bottleNumber} of 3</div>
        <div className="bottle-card-time">{formatTimeRange(startTime, endTime)}</div>

        {status === 'ongoing' && (
          <div className="bottle-card-live-badge">Live · IV Running</div>
        )}
        {status === 'upcoming' && (
          <div className="bottle-card-upcoming">Not yet started</div>
        )}

        {hasDrug && isPremium && (
          <>
            <div className="bottle-card-drug-pill">
              💊 {drug.name} given{injectedAt ? ` at ${injectedAt}` : ''}
            </div>
            {score != null && (
              <>
                <div className="bottle-card-efficacy-text">{efficacyText(score)}</div>
                <EffectivenessBar score={score} />
              </>
            )}
          </>
        )}

        {hasDrug && !isPremium && (
          <div className="bottle-card-basic-pill">Treatment details available in Premium Plan</div>
        )}

        {!hasDrug && status !== 'ongoing' && status !== 'upcoming' && (
          <div className="bottle-card-no-drug">Plain saline — no medication added</div>
        )}

        {status !== 'upcoming' && (
          <Link
            to={`/patient/${patientId}/bottle/${id}`}
            className="bottle-card-link"
          >
            View Full Details →
          </Link>
        )}
      </div>
    </div>
  );
}
