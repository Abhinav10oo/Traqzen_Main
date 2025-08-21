import { dashboardData } from "../data/mockData.js";
import VehicleCard from "../components/VehicleCard.jsx";
import KpiCard from "../components/KpiCard.jsx";
import DashboardCharts from "../components/charts/DashboardCharts.jsx";
import { Truck, Users, Wrench, Fuel } from "lucide-react";

export default function Overview() {
  const kpi = dashboardData.kpis;
  const vehicles = dashboardData.vehicles.slice(0, 6);

  return (
    <div className="page active">
      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <p className="page-subtitle">Monitor your fleet performance and vehicle status</p>
      </div>

      <div className="kpi-grid">
        <KpiCard icon={Truck} bg="var(--color-bg-1)" value={kpi.totalVehicles} label="Total Vehicles" />
        <KpiCard icon={Users} bg="var(--color-bg-3)" value={kpi.activeDrivers} label="Active Drivers" />
        <KpiCard icon={Wrench} bg="var(--color-bg-4)" value={kpi.maintenanceDue} label="Maintenance Due" />
        <KpiCard icon={Fuel} bg="var(--color-bg-3)" value={kpi.fuelEfficiency} label="Fuel Efficiency" />
      </div>

      <DashboardCharts />

      <div className="vehicle-list-section">
        <div className="section-header">
          <h3 className="section-title">Active Vehicles</h3>
          <a className="btn btn--outline btn--sm" href="/vehicles">View All</a>
        </div>
        <div className="vehicle-grid">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} v={v} />
          ))}
        </div>
      </div>
    </div>
  );
}
