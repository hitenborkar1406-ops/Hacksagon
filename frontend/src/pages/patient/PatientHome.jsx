/**
 * PatientHome — PRD §13.1 patient/family dashboard: vitals, IV, vision, drug curve, alerts.
 */
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useVitals } from '../../hooks/useVitals';
import { useBottleSessions } from '../../hooks/useBottleSessions';
import { useInsights } from '../../hooks/useInsights';
import { useAlerts } from '../../hooks/useAlerts';
import { useIVVision } from '../../hooks/useIVVision';
import { useSocket } from '../../hooks/useSocket';
import { getPatientById } from '../../api/index.js';
import StatusIndicator from '../../components/patient/StatusIndicator';
import BottleCard from '../../components/patient/BottleCard';
import InsightBanner from '../../components/patient/InsightBanner';
import VitalsChart from '../../components/VitalsChart';
import PatientDrugCurveSection from '../../components/patient/PatientDrugCurveSection';
import PatientAlertsStrip from '../../components/patient/PatientAlertsStrip';
import PatientIVVisionBar from '../../components/patient/PatientIVVisionBar';
import { getOverallStatus } from '../../utils/insightGenerator';

const STATUS_PILL = {
  normal: 'status-pill-large normal',
  warning: 'status-pill-large warning',
  critical: 'status-pill-large critical',
};

function LastUpdated({ latest }) {
  const [nowTs, setNowTs] = useState(0);
  const timestamp = latest?.timestamp;

  useEffect(() => {
    if (!timestamp) return;
    queueMicrotask(() => {
      setNowTs(Date.now());
    });
    const interval = setInterval(() => {
      setNowTs(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, [timestamp]);

  if (!timestamp || nowTs === 0) return null;

  const mins = Math.floor((nowTs - new Date(timestamp).getTime()) / 60000);
  return <div className="last-updated">Last updated {mins === 0 ? 'just now' : `${mins} min ago`}</div>;
}

function padSessions(sessions) {
  const result = [...sessions];
  while (result.length < 3) {
    result.push({ _placeholder: true, bottleNumber: result.length + 1, status: 'upcoming' });
  }
  return result.slice(0, 3);
}

function vitalsToChartData(vitals) {
  return vitals.map((v, i) => ({
    t: i * 3,
    hr: v.heartRate,
    spo2: v.spo2,
  }));
}

export default function PatientHome() {
  const { patientId = 'rahul-sharma' } = useParams();
  const [resolvedId, setResolvedId] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPatientById(patientId)
      .then((res) => {
        const p = res?.data;
        if (!p || cancelled) return;
        const id = p._id?.toString?.() || p._id;
        setProfile(p);
        setResolvedId(id || patientId);
      })
      .catch(() => {
        if (!cancelled) setResolvedId(patientId);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const pid = resolvedId || patientId;
  const { vitals, latest, loading: vitalsLoading } = useVitals(pid, 100);
  const { sessions } = useBottleSessions(patientId);
  const displayName = profile?.name || 'Patient';
  const wardLine = profile ? [profile.bedNumber, profile.ward].filter(Boolean).join(' · ') : '—';

  const { insight, rawInsight, isLoading: insightLoading } = useInsights(pid, displayName);
  const { alerts } = useAlerts(pid);
  const { visionStatus } = useIVVision();
  const { connected, reconnecting } = useSocket();

  const overall = getOverallStatus(latest);
  const paddedSessions = padSessions(sessions);
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const chartData = vitalsToChartData(vitals);

  const hr = latest?.heartRate;
  const spo2 = latest?.spo2;
  const ivRunning = (latest?.ivStatus || 'running') === 'running';

  return (
    <div className="patient-page">
      <div className="patient-header patient-prd-header">
        <div>
          <div className="patient-name-large">{displayName}</div>
          <div className="patient-info-sub">{wardLine}</div>
        </div>
        <div className="patient-connection-row">
          {reconnecting || !connected ? (
            <span className="patient-conn patient-conn-warn" role="status">
              Reconnecting…
            </span>
          ) : (
            <span className="patient-conn patient-conn-ok" role="status">
              Live
            </span>
          )}
        </div>
        <div className={STATUS_PILL[overall.level]}>{overall.label}</div>
        <LastUpdated latest={latest} />
      </div>

      <InsightBanner insight={insight} isLoading={insightLoading} />

      <div className="patient-prd-grid-top">
        <div className="patient-prd-stat">
          <div className="patient-prd-stat-label">Heart rate</div>
          <div className="patient-prd-stat-value">
            {vitalsLoading && hr == null ? '—' : Math.round(hr ?? 0)}
            <span className="patient-prd-unit">BPM</span>
          </div>
        </div>
        <div className="patient-prd-stat">
          <div className="patient-prd-stat-label">SpO₂</div>
          <div className="patient-prd-stat-value">
            {vitalsLoading && spo2 == null ? '—' : Number(spo2 ?? 0).toFixed(1)}
            <span className="patient-prd-unit">%</span>
          </div>
        </div>
        <div className="patient-prd-stat patient-prd-iv">
          <div className="patient-prd-stat-label">IV status</div>
          <div className={`patient-iv-badge ${ivRunning ? 'running' : 'stopped'}`}>
            {ivRunning ? 'Running' : 'Stopped'}
          </div>
          <PatientIVVisionBar visionStatus={visionStatus} />
        </div>
      </div>

      <div className="patient-section">
        <div className="patient-section-title">Vitals trend</div>
        <div className="patient-chart-wrap">
          {chartData.length >= 1 ? (
            <VitalsChart data={chartData} />
          ) : (
            <p className="patient-muted-text">Waiting for readings…</p>
          )}
        </div>
      </div>

      <div className="patient-prd-split">
        <PatientDrugCurveSection rawInsight={rawInsight} />
        <PatientAlertsStrip alerts={alerts} />
      </div>

      <div className="patient-section">
        <div className="patient-section-title">Current status</div>
        <StatusIndicator
          latest={latest}
          ivStatus={latest?.ivStatus || 'running'}
          ivRemaining={latest?.ivRemaining ?? 500}
        />
      </div>

      <div className="patient-section">
        <div className="patient-section-title">Today&apos;s treatment — {today}</div>
        <div className="bottle-card-list">
          {paddedSessions.map((s, i) =>
            s._placeholder ? (
              <div key={i} className="bottle-card upcoming">
                <div className="bottle-circle upcoming">
                  <span>{s.bottleNumber}</span>
                </div>
                <div className="bottle-card-body">
                  <div className="bottle-card-title">Bottle {s.bottleNumber} of 3</div>
                  <div className="bottle-card-upcoming">Not yet started</div>
                </div>
              </div>
            ) : (
              <BottleCard key={s._id || i} session={s} patientId={patientId} />
            )
          )}
        </div>
        <Link to={`/patient/${patientId}/today`} className="btn-text patient-view-all">
          View detailed sessions →
        </Link>
      </div>

      <div className="patient-quick-nav">
        <Link to={`/patient/${patientId}/history`} className="patient-nav-card">
          <span className="patient-nav-icon">📋</span>
          <span>History</span>
        </Link>
        <Link to={`/patient/${patientId}/export`} className="patient-nav-card">
          <span className="patient-nav-icon">📤</span>
          <span>Export &amp; share</span>
        </Link>
      </div>
    </div>
  );
}
