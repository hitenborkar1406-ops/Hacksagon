import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const API = import.meta.env.VITE_API_URL || '';

// Demo credentials for offline / deployed demo mode (no backend required)
const DEMO_USERS = [
  { email: 'staff@hospital.local', password: 'demo123', token: 'demo-staff-token', user: { id: 'demo_staff', email: 'staff@hospital.local', name: 'Clinical Staff', role: 'staff', patientSlug: null } },
  { email: 'family@hospital.local', password: 'demo123', token: 'demo-family-token', user: { id: 'demo_fam', email: 'family@hospital.local', name: 'Family Member', role: 'family', patientSlug: 'rahul-sharma' } },
];

function tryDemoLogin(email, password) {
  const match = DEMO_USERS.find(u => u.email === email.toLowerCase() && u.password === password);
  return match || null;
}

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('All fields required.');
      return;
    }
    setLoading(true);

    // Try real backend first, fall back to demo credentials
    let data = null;
    let ok = false;

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.token) {
        data = json;
        ok = true;
      }
    } catch {
      // Backend unreachable — will try demo fallback below
    }

    if (!ok) {
      // Offline / demo fallback
      const demo = tryDemoLogin(email, password);
      if (demo) {
        data = demo;
        ok = true;
      }
    }

    setLoading(false);

    if (!ok || !data) {
      setError('Invalid email or password.');
      return;
    }

    login(data.token, data.user);
    const dest = loc.state?.from;
    if (data.user.role === 'family') {
      nav(`/patient/${data.user.patientSlug || 'rahul-sharma'}`, { replace: true });
    } else if (dest && dest !== '/login') {
      nav(dest, { replace: true });
    } else {
      nav('/', { replace: true });
    }
  }

  return (
    <div className="login-page">
      <div className="login-grid-bg" />

      <div style={{ position: 'absolute', bottom: '15%', left: 0, right: 0, opacity: 0.15, pointerEvents: 'none' }}>
        <svg viewBox="0 0 1200 60" style={{ width: '100%', height: 60 }} preserveAspectRatio="none">
          <path d="M0,30 L80,30 L90,30 L95,5 L105,55 L115,8 L125,48 L135,30 L240,30 L250,30 L255,5 L265,55 L275,8 L285,48 L295,30 L400,30 L410,30 L415,5 L425,55 L435,8 L445,48 L455,30 L560,30 L570,30 L575,5 L585,55 L595,8 L605,48 L615,30 L720,30 L730,30 L735,5 L745,55 L755,8 L765,48 L775,30 L880,30 L890,30 L895,5 L905,55 L915,8 L925,48 L935,30 L1040,30 L1050,30 L1055,5 L1065,55 L1075,8 L1085,48 L1095,30 L1200,30" stroke="#00d4ff" strokeWidth="1.5" fill="none" />
        </svg>
      </div>

      <div className="login-panel">
        <div className="login-logo">
          <div className="login-logo-icon">💉</div>
          <div className="login-logo-text">
            <div className="login-logo-title">IV DRIP SYSTEM</div>
            <div className="login-logo-sub">IoT HEALTHCARE MONITORING</div>
          </div>
        </div>

        <div className="login-title">Sign in</div>
        <div className="login-sub">Clinical staff and family accounts</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className={`form-input ${error ? 'error' : ''}`}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className={`form-input ${error ? 'error' : ''}`}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          No account? <Link to="/register">Create one</Link>
        </p>

        <div className="login-demo-hint">
          Demo: staff@hospital.local / family@hospital.local — password: demo123
        </div>
      </div>
    </div>
  );
}
