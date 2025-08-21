import { Menu, Search, Truck, ChevronDown, User as UserIcon } from "lucide-react";
import { useUI } from "../context/UIContext.jsx";
import "../styles/Navbar.css";


export default function Navbar() {
  const { sidebarOpen, setSidebarOpen, role, setRole, setSearch, notify } = useUI();

  return (
    <>
      <div className="navbar-left">
        <button
          className="burger-menu"
          onClick={(e) => {
            e.preventDefault();
            setSidebarOpen(!sidebarOpen);
          }}
          aria-label="Toggle sidebar"
        >
          <Menu className="burger-icon" />
        </button>
        <div className="navbar-logo">
          <Truck className="navbar-logo-icon" />
          <span className="navbar-logo-text">TelematicsHub</span>
        </div>
      </div>

      <div className="navbar-center">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search vehicles, drivers..."
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="navbar-right">
        <div className="role-toggle">
          <select
            className="role-select"
            value={role}
            onChange={(e) => {
              const next = e.target.value;
              if (next === "driver") {
                notify("Switched to Driver View - Limited access mode", "info");
              } else {
                notify("Switched to Owner View - Full access mode", "success");
              }
              setRole(next);
            }}
          >
            <option value="owner">Owner View</option>
            <option value="driver">Driver View</option>
          </select>
        </div>

        <div className="profile-dropdown">
          <button className="profile-button">
            <UserIcon className="profile-icon" />
            <ChevronDown className="profile-arrow" />
          </button>
          {/* flesh out later */}
        </div>
      </div>
    </>
  );
}
