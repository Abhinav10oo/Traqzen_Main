import { createContext, useContext, useEffect, useState } from 'react';
import { collection, getDocs, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

const DataContext = createContext(null);

async function fetchCollection(name) {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
}

export function DataProvider({ children }) {
  const [vehicles,    setVehicles]    = useState([]);
  const [alerts,      setAlerts]      = useState([]);
  const [drivers,     setDrivers]     = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [documents,   setDocuments]   = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [fuelTrend,   setFuelTrend]   = useState([]);
  const [tripData,    setTripData]    = useState([]);
  const [speedData,   setSpeedData]   = useState([]);
  const [liveTs,      setLiveTs]      = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    let vehiclesUnsub = null;
    let alertsUnsub   = null;

    async function load() {
      try {
        const [dData, mData, docData, tData, ftData, tdData, sdData] = await Promise.all([
          fetchCollection('drivers'),
          fetchCollection('maintenance'),
          fetchCollection('documents'),
          fetchCollection('trips'),
          fetchCollection('fuelTrend'),
          fetchCollection('tripData'),
          fetchCollection('speedData'),
        ]);

        if (dData.length)   setDrivers(dData);
        if (mData.length)   setMaintenance(mData);
        if (docData.length) setDocuments(docData);
        if (tData.length)   setRecentTrips(tData);
        if (ftData.length)  setFuelTrend(ftData);
        if (tdData.length)  setTripData(tdData);
        if (sdData.length)  setSpeedData(sdData);

        vehiclesUnsub = onSnapshot(
          collection(db, 'vehicles'),
          (vSnap) => {
            const vData = vSnap.docs.map(d => ({ ...d.data(), id: d.id, _docId: d.id }));
            setVehicles(vData);
            setLiveTs(new Date());
          },
          (err) => console.warn('Vehicles listener error:', err.message)
        );

        alertsUnsub = onSnapshot(
          query(collection(db, 'alerts'), orderBy('created_at', 'desc'), limit(50)),
          (aSnap) => {
            const aData = aSnap.docs.map(d => ({ ...d.data(), _docId: d.id, id: d.id }));
            setAlerts(aData);
          },
          (err) => console.warn('Alerts listener error:', err.message)
        );
      } catch (err) {
        console.warn('Firestore error:', err.message);
      } finally {
        setDataLoading(false);
      }
    }

    load();

    return () => {
      if (vehiclesUnsub) vehiclesUnsub();
      if (alertsUnsub)   alertsUnsub();
    };
  }, []);

  return (
    <DataContext.Provider value={{
      vehicles, alerts, drivers, maintenance, documents,
      recentTrips, fuelTrend, tripData, speedData,
      liveTs, dataLoading,
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
