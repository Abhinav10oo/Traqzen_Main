import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashNavbar from '../../components/DashNavbar';
import Sidebar from '../../components/Sidebar';
import ProfileCompletionReminder from '../../components/ProfileCompletionReminder';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { userRole } = useAuth();
  const view = userRole || 'owner';

  return (
    <div className={`dash-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <DashNavbar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        view={view}
      />
      <Sidebar open={sidebarOpen} view={view} />
      <main className="dash-main">
        <div className="dash-content">
          <Outlet context={{ view }} />
        </div>
      </main>
      <ProfileCompletionReminder />
    </div>
  );
}
