import { NavLink } from "react-router-dom";
import { Truck, Home, Car, FileText, BarChart3, Wrench, Folder, Settings, User } from "lucide-react";
import { useUI } from "../context/UIContext.jsx";
import '../styles/Sidebar.css';

export default function Sidebar() {
  const { setSidebarOpen } = useUI();
  const nav = [
    { to: "/", icon: Home, label: "Overview", end: true },
    { to: "/vehicles", icon: Car, label: "Vehicle List" },
    { to: "/reports", icon: FileText, label: "Reports" },
    { to: "/analytics", icon: BarChart3, label: "Analytics" },
    { to: "/maintenance", icon: Wrench, label: "Maintenance" },
    { to: "/documents", icon: Folder, label: "Documents" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  const handleLinkClick = () => {
    // On smaller screens (<= 768px), the sidebar is an overlay.
    // We close it when a navigation link is clicked for better UX.
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Truck className="sidebar-logo-icon" />
          <span className="sidebar-logo-text">TelematicsHub</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="sidebar-nav-list">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <li className="sidebar-nav-item" key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `sidebar-nav-link ${isActive ? "active" : ""}`
                }
                onClick={handleLinkClick}
              >
                <Icon className="sidebar-nav-icon" />
                <span className="sidebar-nav-text">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          <User className="sidebar-user-icon" />
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">John Manager</div>
          <div className="sidebar-user-role">Fleet Manager</div>
        </div>
      </div>
    </>
  );
}
