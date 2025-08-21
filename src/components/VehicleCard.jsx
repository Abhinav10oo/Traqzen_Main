import { Link } from "react-router-dom";
import { Fuel, Wrench } from "lucide-react";
import '../styles/VehicleCard.css';

export default function VehicleCard({ v }) {
  return (
    <Link to={`/vehicles/${v.id}`} className="card vehicle-card" style={{ textDecoration: "none" }}>
      <div className="card__body">
        <div className="vehicle-card__header">
          <h4>{v.name}</h4>
          <span className="status status--info">{v.status}</span>
        </div>
        <p className="m-0">{v.licensePlate} • {v.type}</p>
        <p className="m-0">Driver: {v.driver ?? "—"}</p>
        <div className="vehicle-card__meta mt-8">
          <span><Fuel size={16} /> {v.fuelLevel}%</span>
          <span><Wrench size={16} /> Next: {v.nextMaintenance}</span>
        </div>
      </div>
    </Link>
  );
}
