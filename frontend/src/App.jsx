import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import VehicleList from './pages/dashboard/VehicleList';
import Analytics from './pages/dashboard/Analytics';
import Reports from './pages/dashboard/Reports';
import Maintenance from './pages/dashboard/Maintenance';
import Documents from './pages/dashboard/Documents';
import UploadDocuments from './pages/dashboard/UploadDocuments';
import Settings from './pages/dashboard/Settings';
import ProfileVerification from './pages/dashboard/ProfileVerification';

function PrivateRoute({ children }) {
  const { currentUser, authLoading } = useAuth();
  if (authLoading) return null;
  return currentUser ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Dashboard — protected */}
      <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview"    element={<Overview />} />
        <Route path="vehicles"    element={<VehicleList />} />
        <Route path="analytics"   element={<Analytics />} />
        <Route path="reports"     element={<Reports />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="documents"   element={<Documents />} />
        <Route path="upload"      element={<UploadDocuments />} />
        <Route path="settings"             element={<Settings />} />
        <Route path="profile-verification" element={<ProfileVerification />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
          <Toaster
            position="bottom-right"
            richColors
            expand={false}
            duration={5000}
            toastOptions={{
              style: {
                background: 'rgba(4,15,20,0.97)',
                border: '1px solid rgba(42,142,158,0.25)',
                color: '#e2e8f0',
                fontSize: '0.88rem',
              },
            }}
          />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
