import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import './DashNavbar.css';

const SEVERITY_ICON  = { danger: '🚨', warning: '⚠️', info: 'ℹ️' };
const SEVERITY_COLOR = { danger: '#e74c3c', warning: '#f39c12', info: '#3ab5c8' };

function timeAgo(isoStr) {
  if (!isoStr) return '';
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function DashNavbar({ sidebarOpen, setSidebarOpen, view }) {
  const { logout, userProfile } = useAuth();
  const { alerts } = useData();
  const navigate   = useNavigate();

  const initials = userProfile?.name
    ? userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const [profileOpen, setProfileOpen]   = useState(false);
  const [notifOpen,   setNotifOpen]     = useState(false);
  const [searchVal,   setSearchVal]     = useState('');
  const [readIds,     setReadIds]       = useState(new Set());

  const profileRef = useRef(null);
  const notifRef   = useRef(null);
  const seenRef    = useRef(new Set(JSON.parse(localStorage.getItem('seen_alert_ids') || '[]')));

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Show sonner toast for NEW danger/warning alerts
  useEffect(() => {
    alerts.forEach(a => {
      const id = a._docId || a.id;
      if (!id || seenRef.current.has(id)) return;
      seenRef.current.add(id);
      localStorage.setItem('seen_alert_ids', JSON.stringify([...seenRef.current]));
      if (a.resolved === true) return;

      if (a.severity === 'danger') {
        toast.error(a.message || a.alert_type || 'Danger alert', {
          description: `Vehicle: ${a.vehicle_id || a.vehicleReg || '—'}`,
          duration: 6000,
        });
      } else if (a.severity === 'warning') {
        toast.warning(a.message || a.alert_type || 'Warning alert', {
          description: `Vehicle: ${a.vehicle_id || a.vehicleReg || '—'}`,
          duration: 5000,
        });
      }
    });
  }, [alerts]);

  const unresolved  = alerts.filter(a => a.resolved !== true);
  const unreadCount = unresolved.filter(a => !readIds.has(a._docId || a.id)).length;

  function markAllRead() {
    setReadIds(new Set(unresolved.map(a => a._docId || a.id)));
  }

  return (
    <header className="dash-navbar">
      {/* Left: burger + logo */}
      <div className="dash-nav-left">
        <button className="burger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <Link to="/dashboard/overview" className="dash-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="var(--primary)"/>
            <path d="M6 18 L10 10 L14 15 L18 8 L22 18" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="14" cy="22" r="2" fill="white"/>
          </svg>
          <span className="dash-logo-text">TelematicsHub</span>
        </Link>
      </div>

      {/* Centre: search */}
      <div className="dash-search-wrap">
        <div className="dash-search">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search vehicles, drivers, alerts..."
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
          />
          {searchVal && <button className="search-clear" onClick={() => setSearchVal('')}>✕</button>}
        </div>
      </div>

      {/* Right */}
      <div className="dash-nav-right">

        {/* Role badge */}
        <div className="nav-view-btn" style={{ cursor: 'default', pointerEvents: 'none' }}>
          <span className="view-icon">{view === 'owner' ? '👑' : '🚗'}</span>
          <span>{view === 'owner' ? 'Owner / Admin' : 'Driver'}</span>
        </div>

        {/* ── Notification Bell ── */}
        <div className="nav-dropdown-wrap" ref={notifRef}>
          <button
            className="nav-icon-btn"
            onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markAllRead(); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span className="nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="nav-dropdown notif-dropdown">
              {/* Header */}
              <div className="notif-header">
                <span className="notif-title">Notifications</span>
                {unresolved.length > 0 && (
                  <button className="notif-mark-all" onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="notif-list">
                {unresolved.length === 0 ? (
                  <div className="notif-empty">
                    <span style={{ fontSize: '1.8rem' }}>🔔</span>
                    <div>No active alerts</div>
                  </div>
                ) : (
                  unresolved.slice(0, 10).map(a => {
                    const id      = a._docId || a.id;
                    const isUnread = !readIds.has(id);
                    const color   = SEVERITY_COLOR[a.severity] || '#64748b';
                    return (
                      <div key={id} className={`notif-item ${isUnread ? 'notif-unread' : ''}`}>
                        <div className="notif-icon" style={{ background: `${color}22`, color }}>
                          {SEVERITY_ICON[a.severity] || '🔔'}
                        </div>
                        <div className="notif-body">
                          <div className="notif-type" style={{ color }}>
                            {(a.alert_type || a.type || 'Alert').replace(/_/g, ' ').toUpperCase()}
                          </div>
                          <div className="notif-msg">{a.message}</div>
                          <div className="notif-meta">
                            {a.vehicle_id || a.vehicleReg || '—'}
                            {a.created_at && ` · ${timeAgo(a.created_at)}`}
                            {!a.created_at && a.time && ` · ${a.time}`}
                          </div>
                        </div>
                        {isUnread && <div className="notif-dot" style={{ background: color }} />}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {unresolved.length > 0 && (
                <div className="notif-footer">
                  <button
                    className="notif-view-all"
                    onClick={() => { setNotifOpen(false); navigate('/dashboard/overview'); }}
                  >
                    View all alerts →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="nav-dropdown-wrap" ref={profileRef}>
          <button className="nav-avatar-btn" onClick={() => setProfileOpen(!profileOpen)}>
            <div className="avatar" style={{ overflow: 'hidden', padding: 0 }}>
              {userProfile?.photoURL
                ? <img src={userProfile.photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : initials}
            </div>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {profileOpen && (
            <div className="nav-dropdown profile-dropdown">
              <div className="profile-header">
                <div className="avatar lg" style={{ overflow: 'hidden', padding: 0 }}>
                  {userProfile?.photoURL
                    ? <img src={userProfile.photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : initials}
                </div>
                <div>
                  <div className="profile-name">{userProfile?.name || 'User'}</div>
                  <div className="profile-role">{view === 'owner' ? 'Fleet Owner' : 'Driver'}</div>
                </div>
              </div>
              <div className="dd-divider" />
              <Link to="/dashboard/profile-verification" className="nav-dd-item" onClick={() => setProfileOpen(false)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Profile
              </Link>
              <Link to="/dashboard/settings" className="nav-dd-item" onClick={() => setProfileOpen(false)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                </svg>
                Settings
              </Link>
              <div className="dd-divider" />
              <button className="nav-dd-item signout" onClick={() => logout().then(() => navigate('/login'))}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
