// ===== DATA CONTEXT =====
// VITE_DEMO_MODE=true  → use fakeData + live simulator (no Firestore reads)
// VITE_DEMO_MODE=false → load from Firestore, no live simulator
// Dashboard pages use: const { vehicles, alerts, liveTs, ... } = useData()

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { seedFirestore } from '../utils/seedFirestore';
import { startLiveSimulation } from '../utils/liveSimulator';
import * as fake from '../data/fakeData';

const DataContext = createContext(null);
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

async function fetchCollection(name) {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
}

export function DataProvider({ children }) {
  const [vehicles,    setVehicles]    = useState(fake.vehicles);
  const [alerts,      setAlerts]      = useState(fake.alerts);
  const [drivers,     setDrivers]     = useState(fake.drivers);
  const [maintenance, setMaintenance] = useState(fake.maintenance);
  const [documents,   setDocuments]   = useState(fake.documents);
  const [recentTrips, setRecentTrips] = useState(fake.recentTrips);
  const [fuelTrend,   setFuelTrend]   = useState(fake.fuelTrend);
  const [tripData,    setTripData]    = useState(fake.tripData);
  const [speedData,   setSpeedData]   = useState(fake.speedData);
  const [liveTs,      setLiveTs]      = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  const stopSimRef = useRef(null);

  useEffect(() => {
    async function load() {
      if (DEMO_MODE) {
        // Skip Firestore — fakeData is already set as initial state
        setDataLoading(false);
        return;
      }

      try {
        const snap = await getDocs(collection(db, 'vehicles'));
        if (snap.empty) await seedFirestore();

        const [
          vData, aData, dData, mData, docData, tData, ftData, tdData, sdData,
        ] = await Promise.all([
          fetchCollection('vehicles'),
          fetchCollection('alerts'),
          fetchCollection('drivers'),
          fetchCollection('maintenance'),
          fetchCollection('documents'),
          fetchCollection('trips'),
          fetchCollection('fuelTrend'),
          fetchCollection('tripData'),
          fetchCollection('speedData'),
        ]);

        const realVehicles = vData.filter(v => (v._docId || v.id) === 'mritunjay');
        setVehicles(realVehicles.length ? realVehicles : fake.vehicles);
        if (aData.length)   setAlerts(aData);
        if (dData.length)   setDrivers(dData);
        if (mData.length)   setMaintenance(mData);
        if (docData.length) setDocuments(docData);
        if (tData.length)   setRecentTrips(tData);
        if (ftData.length)  setFuelTrend(ftData);
        if (tdData.length)  setTripData(tdData);
        if (sdData.length)  setSpeedData(sdData);
      } catch (err) {
        console.warn('Firestore unavailable, using local demo data:', err.message);
      } finally {
        setDataLoading(false);
      }
    }

    load().then(() => {
      if (DEMO_MODE) {
        // Only run the live simulator in demo mode
        stopSimRef.current = startLiveSimulation(
          setVehicles,
          setAlerts,
          setSpeedData,
          setLiveTs,
          3000
        );
      }
    });

    return () => {
      if (stopSimRef.current) stopSimRef.current();
    };
  }, []);

  const value = {
    vehicles, alerts, drivers, maintenance, documents,
    recentTrips, fuelTrend, tripData, speedData,
    liveTs,       // Date object — updated every 3 s in DEMO_MODE; drives "LIVE" badge
    dataLoading,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    return {
      vehicles:    fake.vehicles,
      alerts:      fake.alerts,
      drivers:     fake.drivers,
      maintenance: fake.maintenance,
      documents:   fake.documents,
      recentTrips: fake.recentTrips,
      fuelTrend:   fake.fuelTrend,
      tripData:    fake.tripData,
      speedData:   fake.speedData,
      liveTs:      null,
      dataLoading: true,
    };
  }
  return ctx;
}
