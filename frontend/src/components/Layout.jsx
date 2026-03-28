import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { MOCK_ALERTS } from '../utils/formatVitals';

const MOCK_PATIENTS_SIDEBAR = [
  { bed: 'Bed 4A', name: 'Rahul Sharma', status: 'stable' },
  { bed: 'Bed 3B', name: 'Priya Nair', status: 'watch' },
  { bed: 'Bed 7C', name: 'Kavya Reddy', status: 'critical' },
];

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: DashIcon, end: true },
  { to: '/vitals', label: 'Vitals', icon: VitalsIcon },
  { to: '/iv-monitor', label: 'IV Monitor', icon: IVIcon },
  { to: '/camera', label: 'Camera', icon: CameraIcon },
  { to: '/alerts', label: 'Alerts', icon: BellIcon },
  { to: '/drug-report', label: 'Drug Report', icon: ReportIcon },
];

const unackedAlerts = MOCK_ALERTS.filter((a) => !a.acked).length;

export default function Layout() {
  return (
    <div className="app-shell">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-left">
          <span className="navbar-brand">VitaFlow AI</span>
          <span className="navbar-live-dot" />
        </div>
        <div className="navbar-right">
          <span className="navbar-ward">Ward 3B</span>
          <div className="navbar-bell">
            <BellIcon />
            {unackedAlerts > 0 && (
              <span className="navbar-bell-badge">{unackedAlerts}</span>
            )}
          </div>
          <div className="navbar-avatar">DR</div>
        </div>
      </nav>

      <div className="layout-body">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          {/* Patient section */}
          <div className="sidebar-section-label">Patients</div>
          {MOCK_PATIENTS_SIDEBAR.map((p, i) => (
            <div
              key={i}
              className={`patient-row ${i === 0 ? 'selected' : ''}`}
            >
              <span className={`patient-dot ${p.status}`} />
              <div className="patient-info">
                <div className="patient-bed">{p.bed}</div>
                <div className="patient-name truncate">{p.name}</div>
              </div>
              <span className="patient-status-label" style={{
                fontSize: 10,
                color: p.status === 'critical' ? '#D93025' : p.status === 'watch' ? '#F4A100' : '#2C7BE5'
              }}>
                {p.status === 'critical' ? 'Critical' : p.status === 'watch' ? 'Watch' : 'Stable'}
              </span>
            </div>
          ))}

          <div className="sidebar-divider" />
          <div className="sidebar-section-label">Navigation</div>

          {/* Nav links */}
          {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon />
              <span>{label}</span>
              {label === 'Alerts' && unackedAlerts > 0 && (
                <span className="nav-badge">{unackedAlerts}</span>
              )}
            </NavLink>
          ))}
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
