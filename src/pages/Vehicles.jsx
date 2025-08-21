import { dashboardData } from "../data/mockData.js";
import VehicleCard from "../components/VehicleCard.jsx";

export default function Vehicles() {
  return (
    <div className="page active">
      <div className="page-header">
        <h1 className="page-title">Vehicle Fleet</h1>
        <p className="page-subtitle">Manage and monitor all vehicles</p>
      </div>

      <div className="vehicles-controls">
        <div className="vehicles-filters">
          <select className="form-control" style={{ width: 200 }}>
            <option>All Vehicles</option>
            <option>Active</option>
            <option>Maintenance</option>
            <option>Idle</option>
          </select>
        </div>
        <div className="vehicles-view-toggle">
          <button className="btn btn--outline btn--sm active">Grid</button>
          <button className="btn btn--outline btn--sm">List</button>
        </div>
      </div>

      <div className="vehicles-full-grid">
        {dashboardData.vehicles.map((v) => <VehicleCard key={v.id} v={v} />)}
      </div>
    </div>
  );
}
