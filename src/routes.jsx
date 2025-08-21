import { createBrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import Overview from "./pages/Overview.jsx";
import Vehicles from "./pages/Vehicles.jsx";
import VehicleDetail from "./pages/VehicleDetail.jsx";
import Reports from "./pages/Reports.jsx";
import Analytics from "./pages/Analytics.jsx";
import Maintenance from "./pages/Maintenance.jsx";
import Documents from "./pages/Documents.jsx";
import Settings from "./pages/Settings.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Overview /> },
      { path: "vehicles", element: <Vehicles /> },
      { path: "vehicles/:id", element: <VehicleDetail /> },
      { path: "reports", element: <Reports /> },
      { path: "analytics", element: <Analytics /> },
      { path: "maintenance", element: <Maintenance /> },
      { path: "documents", element: <Documents /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
