import { NavLink, useNavigate } from 'react-router-dom';
import { useSocketContext } from '../context/socketContext.js';
import { LayoutDashboard, Users, Bell, ScrollText, Settings, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Sidebar({ alertCount = 0 }) {
  const { connected, lastSync } = useSocketContext();
  const navigate = useNavigate();
  const [syncText, setSyncText] = useState('--');
  const user = JSON.parse(localStorage.getItem('smartiv_user') || '{"name":"Dr. Admin","role":"Physician"}');

  useEffect(() => {
    if (!lastSync) return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - lastSync) / 1000);
      setSyncText(diff < 60 ? `${diff}s ago` : `${Math.floor(diff / 60)}m ago`);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastSync]);

  function handleLogout() {
    localStorage.removeItem('smartiv_token');
    localStorage.removeItem('smartiv_user');
    navigate('/login');
  }

  const services = [
    { label: 'MQTT', ok: connected },
    { label: 'WebSocket', ok: connected },
    { label: 'AI Layer', ok: connected },
    { label: 'MongoDB', ok: connected },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <div className="logo-icon">💉</div>
          <div className="logo-text">SMART<span>IV</span></div>
        </div>
        <div className="version-tag">v2.1.0 · ICU MONITOR</div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {/* Back to marketing site */}
      <a href="/site/" className="nav-item" style={{ marginBottom: 4, borderColor: 'rgba(0,212,255,0.15)' }}>
        <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Site
      </a>
      <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 8px' }} />

      <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <LayoutDashboard className="nav-icon" />
          Dashboard
        </NavLink>
        <NavLink to="/patients" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Users className="nav-icon" />
          Patients
        </NavLink>
        <NavLink to="/alerts" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Bell className="nav-icon" />
          Alerts
          {alertCount > 0 && <span className="nav-badge">{alertCount}</span>}
        </NavLink>
        <NavLink to="/logs" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <ScrollText className="nav-icon" />
          History Logs
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Settings className="nav-icon" />
          Settings
        </NavLink>
      </nav>

      {/* System Status */}
      <div className="sidebar-status">
        <div className="sidebar-status-title">System Status</div>
        {services.map(s => (
          <div key={s.label} className="status-badge-row">
            <span className={`status-dot ${s.ok ? 'ok' : 'err'}`} />
            <span>{s.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: '10px' }}>{s.ok ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        ))}
        <div className="sync-timer">
          <Activity size={10} style={{ display: 'inline', marginRight: 4 }} />
          Last sync: {lastSync ? syncText : 'Mock mode'}
        </div>

        {/* User + logout */}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div className="user-avatar">{user.name?.[3] || 'D'}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{user.role}</div>
            </div>
          </div>
          <button className="topbar-logout" style={{ width: '100%' }} onClick={handleLogout}>SIGN OUT</button>
        </div>
      </div>
    </aside>
  );
}
