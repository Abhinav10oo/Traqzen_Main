import { Link, useParams } from "react-router-dom";
import { dashboardData } from "../data/mockData.js";
import { ArrowLeft } from "lucide-react";

export default function VehicleDetail() {
  const { id } = useParams();
  const v = dashboardData.vehicles.find((x) => String(x.id) === String(id));

  if (!v) {
    return (
      <div className="page active">
        <div className="page-header">
          <Link className="btn btn--outline btn--sm" to="/vehicles"><ArrowLeft /> Back to Fleet</Link>
          <h1 className="page-title">Vehicle Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="page active">
      <div className="page-header">
        <Link className="btn btn--outline btn--sm" to="/vehicles"><ArrowLeft /> Back to Fleet</Link>
        <h1 className="page-title">{v.name} — {v.licensePlate}</h1>
      </div>

      <div className="card">
        <div className="card__body">
          <div className="grid">
            <p><strong>Type:</strong> {v.type}</p>
            <p><strong>Driver:</strong> {v.driver}</p>
            <p><strong>Status:</strong> {v.status}</p>
            <p><strong>Mileage:</strong> {v.mileage.toLocaleString()} mi</p>
            <p><strong>Fuel Level:</strong> {v.fuelLevel}%</p>
            <p><strong>Location:</strong> {v.location}</p>
            <p><strong>Next Maintenance:</strong> {v.nextMaintenance}</p>
            {v.insurance && (
              <p><strong>Insurance:</strong> {v.insurance.policy} (exp {v.insurance.expiry})</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
