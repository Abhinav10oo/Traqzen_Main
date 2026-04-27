import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

const POLL_INTERVAL = 10000; // 10s

export function DataProvider({ children }) {
  const { currentUser } = useAuth();

  const [vehicles,    setVehicles]    = useState([]);
  const [alerts,      setAlerts]      = useState([]);
  const [drivers,     setDrivers]     = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [documents,   setDocuments]   = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [liveTs,      setLiveTs]      = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // These are static chart data shapes; kept as empty arrays (no Firestore seed data)
  const fuelTrend = [];
  const tripData  = [];
  const speedData = [];

  const pollRef = useRef(null);

  useEffect(() => {
    if (!currentUser) {
      setVehicles([]);
      setAlerts([]);
      setDataLoading(false);
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    async function fetchAll() {
      try {
        const [v, a, d, m, docs, t] = await Promise.allSettled([
          api.get('/api/vehicles/'),
          api.get('/api/alerts/?limit=50'),
          api.get('/api/drivers/').catch(() => []),
          api.get('/api/maintenance/'),
          api.get('/api/documents/'),
          api.get('/api/trips/?limit=20'),
        ]);

        if (v.status === 'fulfilled')    { setVehicles(v.value || []);    setLiveTs(new Date()); }
        if (a.status === 'fulfilled')    setAlerts(a.value || []);
        if (d.status === 'fulfilled')    setDrivers(d.value || []);
        if (m.status === 'fulfilled')    setMaintenance(m.value || []);
        if (docs.status === 'fulfilled') setDocuments(docs.value || []);
        if (t.status === 'fulfilled')    setRecentTrips(t.value || []);
      } catch (err) {
        console.warn('[DataContext] fetch error:', err.message);
      } finally {
        setDataLoading(false);
      }
    }

    fetchAll();
    pollRef.current = setInterval(fetchAll, POLL_INTERVAL);

    return () => clearInterval(pollRef.current);
  }, [currentUser]);

  return (
    <DataContext.Provider value={{
      vehicles, alerts, drivers, maintenance, documents,
      recentTrips, fuelTrend, tripData, speedData,
      liveTs, dataLoading,
      // Helpers for pages that need to mutate and refresh
      refreshVehicles: () => api.get('/api/vehicles/').then(v => { setVehicles(v || []); setLiveTs(new Date()); }),
      refreshAlerts:   () => api.get('/api/alerts/?limit=50').then(a => setAlerts(a || [])),
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
