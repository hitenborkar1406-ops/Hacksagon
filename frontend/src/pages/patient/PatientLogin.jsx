/**
 * PatientLogin.jsx
 * /patient/login — Access code entry for family/patient.
 * Always light theme regardless of global dark mode toggle.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../../hooks/usePlan.js';

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite', marginRight: 8 }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}

function PlanBadge({ plan }) {
  const isPremium = plan === 'premium';
  return (
    <span className={`plan-badge-pill ${isPremium ? 'premium' : 'basic'}`}>
      {isPremium ? 'Premium Plan ★' : 'Basic Plan'}
    </span>
  );
}

export default function PatientLogin() {
  const { login } = usePlan();
  const navigate  = useNavigate();

  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(null); // { plan, patientName, patientId }

  function handleInput(e) {
    setError('');
    setCode(e.target.value.toUpperCase().slice(0, 6));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true); setError('');
    try {
      const data = await login(code.trim());
      setSuccess(data);
      setTimeout(() => navigate(`/patient/${data.patientId}`), 1500);
    } catch (err) {
      setError(err.message || 'Invalid or expired access code. Please check with hospital staff.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="patient-login-page">
      <div className="patient-login-card">
        {!success ? (
          <>
            {/* Branding */}
            <div className="patient-login-brand">
              <div className="patient-login-logo">IV DRIP SYSTEM</div>
              <div className="patient-login-subtitle">Patient &amp; Family Portal</div>
            </div>
            <div className="patient-login-divider" />

            {/* Form */}
            <div className="patient-login-heading">Enter Your Access Code</div>
            <div className="patient-login-subtext">
              Your access code was provided by the treating doctor or nursing staff.
            </div>

            <form onSubmit={handleSubmit} autoComplete="off">
              <input
                id="patient-access-code"
                className="patient-code-input"
                type="text"
                value={code}
                onChange={handleInput}
                placeholder="e.g. RAH001"
                maxLength={6}
                spellCheck={false}
                autoFocus
                disabled={loading}
              />

              <button
                id="patient-login-submit"
                type="submit"
                className="patient-login-btn"
                disabled={loading || !code.trim()}
              >
                {loading ? <><Spinner />Verifying…</> : 'Access Patient Dashboard'}
              </button>
            </form>

            {error && (
              <div className="patient-login-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D93025" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                {error}
              </div>
            )}

            <div className="patient-login-help">
              Having trouble? Contact the nursing station at Ward 3B for assistance.
            </div>
          </>
        ) : (
          /* Success state */
          <div className="patient-login-success">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#27A96C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <div className="patient-login-success-title">Access Granted</div>
            <PlanBadge plan={success.plan} />
            <div className="patient-login-success-name">Viewing data for: {success.patientName}</div>
            <div className="patient-login-redirect-text">Redirecting…</div>
          </div>
        )}
      </div>
    </div>
  );
}
