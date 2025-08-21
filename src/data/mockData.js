// Sample data adapted from your HTML setup. You can grow this as needed. :contentReference[oaicite:2]{index=2}
export const dashboardData = {
  vehicles: [
    {
      id: 1,
      name: "Truck Alpha",
      licensePlate: "ABC-1234",
      type: "Truck",
      driver: "John Smith",
      status: "active",
      fuelLevel: 75,
      mileage: 45320,
      lastMaintenance: "2024-07-15",
      nextMaintenance: "2024-09-15",
      location: "New York, NY",
      insurance: { policy: "INS-2024-001", expiry: "2025-03-15" },
    },
    { id: 2, name: "Van Beta", licensePlate: "DEF-5678", type: "Van", driver: "Sarah Johnson", status: "maintenance", fuelLevel: 45, mileage: 32150, lastMaintenance: "2024-08-01", nextMaintenance: "2024-10-01", location: "Los Angeles, CA" },
    { id: 3, name: "Car Gamma", licensePlate: "GHI-9012", type: "Car", driver: "Mike Davis", status: "active", fuelLevel: 90, mileage: 18750, lastMaintenance: "2024-06-10", nextMaintenance: "2024-12-10", location: "Chicago, IL" },
    { id: 4, name: "Truck Delta", licensePlate: "JKL-3456", type: "Truck", driver: "Emma Wilson", status: "active", fuelLevel: 85, mileage: 52100, lastMaintenance: "2024-08-10", nextMaintenance: "2024-11-10", location: "Miami, FL" },
    { id: 5, name: "Van Echo", licensePlate: "MNO-7890", type: "Van", driver: "David Brown", status: "idle", fuelLevel: 60, mileage: 28900, lastMaintenance: "2024-07-20", nextMaintenance: "2024-10-20", location: "Phoenix, AZ" },
    { id: 6, name: "Car Foxtrot", licensePlate: "PQR-1357", type: "Car", driver: "Lisa Garcia", status: "active", fuelLevel: 40, mileage: 22450, lastMaintenance: "2024-06-30", nextMaintenance: "2024-12-30", location: "Seattle, WA" },
  ],
  kpis: { totalVehicles: 24, activeDrivers: 18, maintenanceDue: 3, fuelEfficiency: "85%" },
};

export const chartData = {
  mileageTrends: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      { label: "Truck Alpha", data: [42000, 42800, 43500, 44200, 44900, 45320], borderColor: "#1FB8CD", backgroundColor: "rgba(31, 184, 205, 0.1)", tension: 0.4 },
      { label: "Van Beta", data: [30000, 30600, 31100, 31600, 31850, 32150], borderColor: "#FFC185", backgroundColor: "rgba(255, 193, 133, 0.1)", tension: 0.4 },
      { label: "Car Gamma", data: [16000, 16800, 17500, 18000, 18400, 18750], borderColor: "#B4413C", backgroundColor: "rgba(180, 65, 60, 0.1)", tension: 0.4 },
    ],
  },
  fleetStatus: {
    labels: ["Active", "Maintenance", "Idle", "Out of Service"],
    datasets: [{ data: [70, 15, 10, 5], backgroundColor: ["#1FB8CD", "#FFC185", "#B4413C", "#ECEBD5"] }],
  },
  fuelConsumption: {
    labels: ["Trucks", "Vans", "Cars", "Motorcycles"],
    datasets: [{ data: [35, 25, 30, 10], backgroundColor: ["#5D878F", "#DB4545", "#D2BA4C", "#964325"] }],
  },
  speedEfficiency: {
    datasets: [{ label: "Vehicles", data: [{ x: 45, y: 25 }, { x: 55, y: 28 }, { x: 65, y: 22 }, { x: 70, y: 18 }, { x: 50, y: 30 }, { x: 60, y: 24 }], backgroundColor: "#944454" }],
  },
};
