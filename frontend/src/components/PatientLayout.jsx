/**
 * PatientLayout.jsx — shell for patient/family view with plan badge support.
 */
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { usePlan } from '../hooks/usePlan.js';

const DEFAULT_SLUG = 'rahul-sharma';

function PlanBadgePill({ plan }) {
  if (!plan) return null;
  return (
    <span className={`plan-badge-pill ${plan === 'premium' ? 'premium' : 'basic'}`}>
      {plan === 'premium' ? 'Premium ★' : 'Basic'}
    </span>
  );
}

function ViewSwitcher() {
  const navigate = useNavigate();
  const loc = useLocation();
  const { user } = useAuth();
  const { isAuthenticated, patientInfo } = usePlan();
  const isPatient = loc.pathname.startsWith('/patient');

  function switchView(view) {
    localStorage.setItem('vitaflow_view', view);
    if (view === 'patient') {
      if (isAuthenticated && patientInfo?.patientId) {
        navigate(`/patient/${patientInfo.patientId}`);
      } else {
        navigate('/patient/login');
      }
    } else {
      navigate('/');
    }
  }

  if (user?.role === 'family') return null;

  return (
    <div className="view-switcher">
      <button type="button" className={`view-pill${!isPatient ? ' active' : ''}`} onClick={() => switchView('doctor')}>
        Doctor view
      </button>
      <button type="button" className={`view-pill${isPatient ? ' active' : ''}`} onClick={() => switchView('patient')}>
        Patient view
      </button>
    </div>
  );
}

export default function PatientLayout() {
  const navigate = useNavigate();
  const { patientId = DEFAULT_SLUG } = useParams();
  const { logout: staffLogout } = useAuth();
  const { isAuthenticated, plan, patientInfo, logout: planLogout } = usePlan();

  function handleSignOut() {
    if (isAuthenticated) {
      planLogout();
      navigate('/patient/login');
    } else {
      staffLogout();
      navigate('/login');
    }
  }

  const displayName = patientInfo?.patientName || '';

  return (
    <div className="patient-shell">
      <nav className="patient-navbar">
        <button
          type="button"
          className="patient-navbar-brand"
          onClick={() => navigate(`/patient/${patientId}`)}
        >
          VitaFlow <span style={{ fontWeight: 400, color: 'var(--clinical-muted, #52606D)' }}>Family</span>
        </button>
        <ViewSwitcher />
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAuthenticated && displayName && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{displayName}</span>
          )}
          {isAuthenticated && <PlanBadgePill plan={plan} />}
          <button
            type="button"
            className="btn-text"
            style={{ fontSize: 13 }}
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </nav>
      <main className="patient-main">
        <Outlet />
      </main>
    </div>
  );
}
