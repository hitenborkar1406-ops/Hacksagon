/**
 * GenerateCodeModal.jsx
 * Doctor-side modal to issue a new patient access code.
 * Opens from the Family Access Codes card on Dashboard.
 */
import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function GenerateCodeModal({ patientId, patientName, bedNumber, onClose }) {
  const [plan, setPlan]       = useState('basic');
  const [expiry, setExpiry]   = useState('none');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [copied, setCopied]   = useState(false);
  const [error, setError]     = useState('');

  function expiresAt() {
    if (expiry === '7d')  return new Date(Date.now() + 7  * 864e5).toISOString();
    if (expiry === '30d') return new Date(Date.now() + 30 * 864e5).toISOString();
    return null;
  }

  async function handleGenerate() {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/patient-access/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId, patientName, bedNumber,
          plan, issuedBy: 'Dr. Anjali Mehta',
          expiresAt: expiresAt(),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setResult(json.data);
    } catch (e) {
      setError(e.message || 'Failed to generate code.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result?.accessCode) return;
    navigator.clipboard.writeText(result.accessCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Generate New Access Code</div>
        <div className="modal-body">
          {!result ? (
            <>
              <label className="modal-label">Plan
                <div className="gen-radio-row">
                  {['basic', 'premium'].map((p) => (
                    <label key={p} className={`gen-radio-pill ${plan === p ? 'active' : ''}`}>
                      <input type="radio" name="plan" value={p} checked={plan === p} onChange={() => setPlan(p)} />
                      {p === 'premium' ? 'Premium ★' : 'Basic'}
                    </label>
                  ))}
                </div>
              </label>
              <label className="modal-label" style={{ marginTop: 12 }}>Expiry
                <select className="modal-input" value={expiry} onChange={(e) => setExpiry(e.target.value)}>
                  <option value="none">No expiry</option>
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                </select>
              </label>
              {error && <div className="gen-error">{error}</div>}
            </>
          ) : (
            <div className="gen-result">
              <div className="gen-code-label">Access Code</div>
              <div className="gen-code-display">{result.accessCode}</div>
              <div className="gen-plan-pill" data-plan={result.plan}>
                {result.plan === 'premium' ? 'Premium Plan ★' : 'Basic Plan'}
              </div>
              <div className="gen-warning">
                ⚠ Save this code now. It cannot be retrieved again.
              </div>
              <div className="gen-instruction">
                Share this code with the patient's family. Do not share publicly.
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={handleCopy}>
                {copied ? '✓ Copied!' : 'Copy Code'}
              </button>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          {!result && (
            <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating…' : 'Generate'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
