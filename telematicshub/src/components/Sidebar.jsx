import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

const ownerMenu = [
  {
    group: 'Main',
    items: [
      { path: '/dashboard/overview',   icon: <GridIcon />,   label: 'Overview' },
      { path: '/dashboard/vehicles',   icon: <CarIcon />,    label: 'Vehicle List' },
      { path: '/dashboard/analytics',  icon: <ChartIcon />,  label: 'Analytics' },
      { path: '/dashboard/reports',    icon: <ReportIcon />, label: 'Reports' },
    ],
  },
  {
    group: 'Fleet',
    items: [
      { path: '/dashboard/maintenance', icon: <WrenchIcon />, label: 'Maintenance' },
      { path: '/dashboard/documents',   icon: <DocIcon />,    label: 'Documents' },
      { path: '/dashboard/upload',      icon: <UploadIcon />, label: 'Upload Documents' },
    ],
  },
  {
    group: 'Account',
    items: [
      { path: '/dashboard/profile-verification', icon: <ShieldIcon />,   label: 'Profile Verification' },
      { path: '/dashboard/settings',             icon: <SettingsIcon />, label: 'Settings' },
    ],
  },
];

const driverMenu = [
  {
    group: 'Driver',
    items: [
      { path: '/dashboard/overview',             icon: <GridIcon />,    label: 'Overview' },
      { path: '/dashboard/vehicles',             icon: <CarIcon />,     label: 'My Vehicle' },
      { path: '/dashboard/reports',              icon: <ReportIcon />,  label: 'Trip History' },
      { path: '/dashboard/documents',            icon: <DocIcon />,     label: 'Documents' },
      { path: '/dashboard/profile-verification', icon: <ShieldIcon />,  label: 'Profile Verification' },
      { path: '/dashboard/settings',             icon: <SettingsIcon />, label: 'Settings' },
    ],
  },
];

export default function Sidebar({ open, view }) {
  const { userProfile } = useAuth();
  const menu = view === 'driver' ? driverMenu : ownerMenu;

  const initials = userProfile?.name
    ? userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';
  const displayName = userProfile?.name || 'User';

  return (
    <>
      {/* Overlay for mobile */}
      <div className={`sidebar-overlay ${open ? 'visible' : ''}`} />

      <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
        <nav className="sidebar-nav">
          {menu.map((group, gi) => (
            <div key={gi} className="sidebar-group">
              <div className="sidebar-group-label">{group.group}</div>
              {group.items.map((item, ii) => (
                <NavLink
                  key={ii}
                  to={item.path}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  <span className="sidebar-item-label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom user info */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar" style={{overflow:'hidden',padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {userProfile?.photoURL
                  ? <img src={userProfile.photoURL} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
                  : initials}
              </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{displayName}</div>
              <div className="sidebar-user-role">{view === 'owner' ? 'Fleet Owner' : 'Driver'}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ===== INLINE SVG ICONS ===== */
function GridIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}
function CarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/>
      <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  );
}
function ReportIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}
function WrenchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  );
}
function DocIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
      <polyline points="13 2 13 9 20 9"/>
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    </svg>
  );
}
