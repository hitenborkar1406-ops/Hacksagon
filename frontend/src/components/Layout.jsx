import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { usePatientContext } from '../context/patientContext.js';
import { useAlerts } from '../hooks/useAlerts.js';
import { useAuth } from '../hooks/useAuth.js';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: DashIcon, end: true },
  { to: '/vitals', label: 'Vitals', icon: VitalsIcon },
  { to: '/iv-monitor', label: 'IV Monitor', icon: IVIcon },
  { to: '/alerts', label: 'Alerts', icon: BellIcon },
  { to: '/drug-report', label: 'Drug Report', icon: ReportIcon },
  { to: '/camera', label: 'Camera', icon: CameraIcon },
];

export default function Layout() {
  const { patients, selectedPatientId, setSelectedPatientId, selectedPatient } = usePatientContext();
  const { alerts, unresolvedCount } = useAlerts(null); // global alerts count
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  function handlePatientClick(id) {
    setSelectedPatientId(id);
    navigate('/');
  }

  function getPatientStatus(id, defaultCond) {
    const pAlerts = alerts.filter(a => String(a.patientId) === String(id) && !a.acknowledged && !a.resolved);
    if (pAlerts.some(a => a.severity === 'critical')) return 'Critical';
    if (pAlerts.some(a => a.severity === 'warning')) return 'Watch';
    return defaultCond || 'Stable';
  }

  function switchView(view) {
    localStorage.setItem('vitaflow_view', view);
    if (view === 'patient') {
      const slug = selectedPatient?.slug || selectedPatientId || 'rahul-sharma';
      navigate(`/patient/${slug}`);
    } else navigate('/');
  }

  return (
    <div className="app-shell">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-left">
          <span className="navbar-brand">IV DRIP SYSTEM</span>
          <span className="navbar-live-dot" />
        </div>
        <div className="navbar-right">
          <div className="view-switcher">
            <button
              className={`view-pill${!loc.pathname.startsWith('/patient') ? ' active' : ''}`}
              onClick={() => switchView('doctor')}
            >
              Doctor View
            </button>
            <button
              className={`view-pill${loc.pathname.startsWith('/patient') ? ' active' : ''}`}
              onClick={() => switchView('patient')}
            >
              Patient View
            </button>
          </div>
          <span className="navbar-ward">Ward 3B</span>
          <div className="navbar-bell" onClick={() => navigate('/alerts')}>
            <BellIcon />
            {unresolvedCount > 0 && (
              <span className="navbar-bell-badge">{unresolvedCount}</span>
            )}
          </div>
          <button
            type="button"
            className="btn-text"
            style={{ fontSize: 12, marginRight: 8 }}
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sign out
          </button>
          <div className="navbar-avatar" title={user?.email || ''}>
            {(user?.name || 'Staff')
              .split(' ')
              .map((s) => s[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
        </div>
      </nav>

      <div className="layout-body">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-section-label">Patients</div>
          {patients.map((p) => {
            const id = p._id?.toString?.() || p._id;
            const liveStatus = getPatientStatus(id, p.condition);
            const statusDot = liveStatus.toLowerCase() === 'critical' ? 'critical' : liveStatus.toLowerCase() === 'watch' ? 'watch' : 'stable';
            const isSelected = id === selectedPatientId;
            return (
              <div
                key={id}
                className={`patient-row${isSelected ? ' selected' : ''}`}
                onClick={() => handlePatientClick(id)}
              >
                <span className={`patient-dot ${statusDot}`} />
                <div className="patient-info">
                  <div className="patient-bed">{p.bedNumber}</div>
                  <div className="patient-name truncate">{p.name}</div>
                </div>
                <span
                  className="patient-status-label"
                  style={{
                    fontSize: 10,
                    color:
                      statusDot === 'critical'
                        ? '#D93025'
                        : statusDot === 'watch'
                        ? '#F4A100'
                        : '#2C7BE5',
                  }}
                >
                  {liveStatus}
                </span>
              </div>
            );
          })}

          <div className="sidebar-divider" />
          <div className="sidebar-section-label">Navigation</div>

          {NAV_LINKS.map((link) => {
            const NavIcon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <NavIcon />
                <span>{link.label}</span>
                {link.label === 'Alerts' && unresolvedCount > 0 && (
                  <span className="nav-badge">{unresolvedCount}</span>
                )}
              </NavLink>
            );
          })}
        </aside>

        {/* ── Page content ── */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ── Inline SVG icons ── */
function DashIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
      <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
    </svg>
  );
}
function VitalsIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,8 4,8 5,4 7,12 9,6 11,8 15,8"/>
    </svg>
  );
}
function IVIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v12M5 5h6M6 8h4M7 11h2"/>
      <rect x="4" y="2" width="8" height="8" rx="1"/>
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4.5A1.5 1.5 0 012.5 3h11A1.5 1.5 0 0115 4.5v7A1.5 1.5 0 0113.5 13h-11A1.5 1.5 0 011 11.5v-7z"/>
      <circle cx="8" cy="8" r="2"/><circle cx="8" cy="8" r="0.5" fill="currentColor"/>
    </svg>
  );
}
function BellIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1a5 5 0 00-5 5v2.5l-1.5 2H14.5L13 8.5V6A5 5 0 008 1z"/>
      <path d="M6.5 13a1.5 1.5 0 003 0"/>
    </svg>
  );
}
function ReportIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="1" width="12" height="14" rx="1"/>
      <line x1="5" y1="5" x2="11" y2="5"/>
      <line x1="5" y1="8" x2="11" y2="8"/>
      <line x1="5" y1="11" x2="8" y2="11"/>
    </svg>
  );
}
