import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './DashNavbar.css';

export default function DashNavbar({ sidebarOpen, setSidebarOpen, view }) {
  const { logout, userProfile } = useAuth();
  const navigate = useNavigate();
  const initials = userProfile?.name
    ? userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const profileRef = useRef(null);
  const viewRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (viewRef.current && !viewRef.current.contains(e.target)) setViewOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

      {/* Centre: search bar */}
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
          {searchVal && (
            <button className="search-clear" onClick={() => setSearchVal('')}>✕</button>
          )}
        </div>
      </div>

      {/* Right: view switcher + profile */}
      <div className="dash-nav-right">

        {/* View dropdown */}
        <div className="nav-dropdown-wrap" ref={viewRef}>
          <button className="nav-view-btn" onClick={() => setViewOpen(!viewOpen)}>
            <span className="view-icon">{view === 'owner' ? '👑' : '🚗'}</span>
            <span>{view === 'owner' ? 'Owner View' : 'Driver View'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {viewOpen && (
            <div className="nav-dropdown">
              <div className={`nav-dd-item ${view === 'owner' ? 'active' : ''}`}>
                <span>👑</span> Owner / Admin View
                {view === 'owner' && <span className="dd-check">✓</span>}
              </div>
              <div className={`nav-dd-item ${view === 'driver' ? 'active' : ''}`}>
                <span>🚗</span> Driver View
                {view === 'driver' && <span className="dd-check">✓</span>}
              </div>
            </div>
          )}
        </div>

        {/* Notification bell */}
        <button className="nav-icon-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="nav-badge">5</span>
        </button>

        {/* Profile dropdown */}
        <div className="nav-dropdown-wrap" ref={profileRef}>
          <button className="nav-avatar-btn" onClick={() => setProfileOpen(!profileOpen)}>
            <div className="avatar">{initials}</div>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {profileOpen && (
            <div className="nav-dropdown profile-dropdown">
              <div className="profile-header">
                <div className="avatar lg">{initials}</div>
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
