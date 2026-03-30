/**
 * ExportPanel.jsx
 * /patient/:patientId/export — 3 sharing cards + download buttons.
 */
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import ExportCard from '../../components/patient/ExportCard';
import ConsentModal from '../../components/patient/ConsentModal';
import PremiumUpgradeCard from '../../components/patient/PremiumUpgradeCard.jsx';
import { usePlan } from '../../hooks/usePlan.js';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PHARMACIES = ['Apollo Pharmacy', 'MedPlus', 'Wellness Forever', 'Local Pharmacy'];

export default function ExportPanel() {
  const { patientId = 'rahul-sharma' } = useParams();
  const { isBasic } = usePlan();
  const [sessions, setSessions] = useState([]);
  const [familyOn, setFamilyOn] = useState(true);
  const [researchOn, setResearchOn] = useState(false);
  const [pharmacyOn, setPharmacyOn] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [pharmacy, setPharmacy] = useState(PHARMACIES[0]);
  const [sentTime, setSentTime] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/sessions/${patientId}/today`)
      .then((r) => r.json())
      .then((json) => { if (json?.data) setSessions(json.data); })
      .catch(() => {});
  }, [patientId]);

  const latestSession = sessions[sessions.length - 1];
  const latestId = latestSession?._id;

  function handleResearchToggle() {
    if (!researchOn) { setShowConsent(true); }
    else { setResearchOn(false); }
  }

  function handleConsentAccept() {
    setResearchOn(true);
    setShowConsent(false);
    if (latestId) {
      fetch(`${API}/api/sessions/${latestId}/export-flags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharedWithResearch: true, sharedWithFamily: familyOn, sharedWithPharmacy: pharmacyOn }),
      }).catch(() => {});
    }
  }

  function handlePharmacySend() {
    setSentTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
  }

  function handleDownload(format) {
    if (!latestId) return alert('No session available to export.');
    window.open(`${API}/api/sessions/${latestId}/export?format=${format}`, '_blank');
  }

  if (isBasic) {
    return (
      <div className="patient-page">
        <div className="patient-page-back">
          <Link to={`/patient/${patientId}`} className="btn-text">← Back</Link>
        </div>
        <div className="patient-header">
          <div className="patient-name-large" style={{ fontSize: 20 }}>Export &amp; Share</div>
        </div>
        <PremiumUpgradeCard message="Export &amp; sharing is available on the Premium Plan. Ask your doctor or nursing staff to upgrade your access." />
      </div>
    );
  }

  return (
    <div className="patient-page">
      {showConsent && (
        <ConsentModal
          session={latestSession}
          onAccept={handleConsentAccept}
          onCancel={() => setShowConsent(false)}
        />
      )}

      <div className="patient-page-back">
        <Link to={`/patient/${patientId}`} className="btn-text">← Back</Link>
      </div>
      <div className="patient-header">
        <div className="patient-name-large" style={{ fontSize: 20 }}>Export & Share</div>
        <div className="patient-info-sub">Control who can access Rahul's health data</div>
      </div>

      {/* Card 1 — Family */}
      <ExportCard
        title="Family Summary"
        description="Share a summary of today's treatment with family members."
        enabled={familyOn}
        onToggle={() => setFamilyOn(!familyOn)}
        actionLabel="Download Family Report"
        onAction={() => window.print()}
      />

      {/* Card 2 — Research */}
      <ExportCard
        title="Research & Pharmaceutical"
        description="Share anonymised data with research teams. No personal information is shared."
        enabled={researchOn}
        onToggle={handleResearchToggle}
      >
        <div className="export-card-research-note">
          All personal details are removed. Only treatment metrics are shared.
        </div>
        <button className="btn-text" onClick={() => setShowConsent(true)}>View What Data Is Shared →</button>
      </ExportCard>

      {/* Card 3 — Pharmacy */}
      <ExportCard
        title="Nearby Pharmacy"
        description="Send prescription info to a nearby pharmacy."
        enabled={pharmacyOn}
        onToggle={() => setPharmacyOn(!pharmacyOn)}
      >
        <select
          className="pharmacy-select"
          value={pharmacy}
          onChange={(e) => setPharmacy(e.target.value)}
        >
          {PHARMACIES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={handlePharmacySend}>
          Send to {pharmacy}
        </button>
        {sentTime && <div className="export-sent-time">Last sent at {sentTime}</div>}
      </ExportCard>

      {/* Downloads */}
      <div className="patient-section">
        <div className="patient-section-title">Download Report</div>
        <div className="download-btn-row">
          <button className="btn btn-ghost" onClick={() => handleDownload('json')}>JSON</button>
          <button className="btn btn-ghost" onClick={() => handleDownload('csv')}>CSV</button>
          <button className="btn btn-ghost" onClick={() => window.print()}>PDF</button>
        </div>
      </div>
    </div>
  );
}
