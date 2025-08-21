// ⬅️ all imports at the top
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Navbar from "./components/Navbar.jsx";
import Notification from "./components/Notification.jsx";
import { useUI } from "./context/UIContext.jsx";

export default function App() {
  const { sidebarOpen, setSidebarOpen } = useUI();

  return (
    <>
      <aside className={`sidebar ${sidebarOpen ? "active" : ""}`}>
        <Sidebar />
      </aside>

      <div className={`main-layout ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
        <header className="navbar">
          <Navbar />
        </header>

        <main className="main-content">
          <Notification />
          <Outlet />
        </main>
      </div>

      {/* overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
    </>
  );
}
