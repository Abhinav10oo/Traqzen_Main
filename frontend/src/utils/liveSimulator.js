// ===== LIVE DATA SIMULATOR =====
// Generates realistic, continuously-changing vehicle telemetry for 6 vehicles.
// Call startLiveSimulation(setVehicles, setAlerts, setSpeedData) to begin.

/** Clamp a value between min and max */
const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

/** Return a random float delta between -range and +range */
const jitter = (range) => (Math.random() * 2 - 1) * range;

/** Round to N decimal places */
const round = (val, dp = 1) => parseFloat(val.toFixed(dp));

// ── Speed profiles per status ──────────────────────────────────────────────
const SPEED_PROFILES = {
  active:      { target: [35, 75], jitter: 8 },   // highway/city mix
  idle:        { target: [0,  0],  jitter: 0 },
  maintenance: { target: [0,  0],  jitter: 0 },
  offline:     { target: [0,  0],  jitter: 0 },
};

/**
 * Tick one vehicle forward in time.
 * Returns a new vehicle object with updated sensor values.
 */
export function tickVehicle(v) {
  if (v.status !== 'active') {
    // Idle: engine cools slowly, tiny fuel drain
    return {
      ...v,
      temp:     round(clamp(v.temp - 0.3 + jitter(0.5), 65, 80)),
      fuel:     round(clamp(v.fuel - 0.01, 0, 100), 1),
    };
  }

  const profile = SPEED_PROFILES.active;
  const [minSpd, maxSpd] = profile.target;

  // Drift speed toward a random target within profile range, add jitter
  const targetSpeed = minSpd + Math.random() * (maxSpd - minSpd);
  const newSpeed = round(
    clamp(v.speed * 0.7 + targetSpeed * 0.3 + jitter(profile.jitter), minSpd, maxSpd)
  );

  // Fuel drains faster at higher speeds
  const fuelDrain = round(0.03 + (newSpeed / 80) * 0.05, 3);
  const newFuel   = round(clamp(v.fuel - fuelDrain, 0, 100), 1);

  // Engine temp: rises with speed, stabilises around 82-90°C
  const tempTarget = 78 + (newSpeed / 80) * 15;
  const newTemp    = round(clamp(v.temp * 0.85 + tempTarget * 0.15 + jitter(1.5), 70, 105));

  // GPS drift: simulate movement along a road (small lat/lng steps)
  const latStep = (jitter(0.0008) + (newSpeed / 80) * 0.0005);
  const lngStep = (jitter(0.0008) + (newSpeed / 80) * 0.0005);

  // Odometer increments proportionally to speed (km per 3s tick ≈ speed/1200)
  const odoInc  = round(newSpeed / 1200, 3);

  return {
    ...v,
    speed:    newSpeed,
    fuel:     newFuel,
    temp:     newTemp,
    lat:      round(v.lat + latStep, 5),
    lng:      round(v.lng + lngStep, 5),
    odometer: round(v.odometer + odoInc, 1),
  };
}

/**
 * Derive alerts from current vehicle states.
 * Keeps existing non-vehicle alerts, replaces sensor-based ones.
 */
export function deriveAlerts(vehicles, existingAlerts) {
  // Keep non-sensor alerts (insurance, pollution, etc.)
  const static_alerts = existingAlerts.filter(a =>
    !['Low Fuel', 'Engine Overheating', 'High Speed'].includes(a.type)
  );

  const live = [];
  const now = new Date();
  const fmt = (v) => {
    const diff = Math.floor((now - v._ts) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  vehicles.forEach(v => {
    if (v.fuel < 25 && v.status !== 'maintenance') {
      live.push({
        id:         `LIVE_FUEL_${v.id}`,
        vehicleId:  v.id,
        vehicleReg: v.reg,
        type:       'Low Fuel',
        severity:   v.fuel < 15 ? 'danger' : 'warning',
        message:    `Fuel level at ${v.fuel}% — ${v.fuel < 15 ? 'Critical! Refuel immediately' : 'Consider refueling soon'}`,
        time:       fmt(v),
        resolved:   false,
        _live:      true,
      });
    }

    if (v.temp > 92 && v.status === 'active') {
      live.push({
        id:         `LIVE_TEMP_${v.id}`,
        vehicleId:  v.id,
        vehicleReg: v.reg,
        type:       'Engine Overheating',
        severity:   v.temp > 100 ? 'danger' : 'warning',
        message:    `Engine temperature at ${v.temp}°C — ${v.temp > 100 ? 'Critical overheating!' : 'Exceeds normal range'}`,
        time:       fmt(v),
        resolved:   false,
        _live:      true,
      });
    }

    if (v.speed > 90) {
      live.push({
        id:         `LIVE_SPD_${v.id}`,
        vehicleId:  v.id,
        vehicleReg: v.reg,
        type:       'High Speed',
        severity:   'warning',
        message:    `Speed alert: ${v.speed} km/h — Exceeds limit`,
        time:       fmt(v),
        resolved:   false,
        _live:      true,
      });
    }
  });

  return [...live, ...static_alerts];
}

/**
 * Slide the speed-data window forward by one tick for the given vehicle.
 * Keeps the last 14 entries so the chart stays the same width.
 */
export function tickSpeedData(speedData, activeVehicle) {
  const now    = new Date();
  const hh     = String(now.getHours()).padStart(2, '0');
  const mm     = String(now.getMinutes()).padStart(2, '0');
  const label  = `${hh}:${mm}`;
  const newPt  = { time: label, speed: activeVehicle?.speed ?? 0 };
  const updated = [...speedData.slice(-13), newPt];
  return updated;
}

/**
 * Start the live simulation.
 *
 * @param {Function} setVehicles  - React setState for vehicles array
 * @param {Function} setAlerts    - React setState for alerts array
 * @param {Function} setSpeedData - React setState for speedData array
 * @param {Function} setLiveTs    - React setState for last-updated timestamp
 * @param {number}   intervalMs   - Tick interval in milliseconds (default 3000)
 * @returns {Function} cleanup – call this to stop the simulation
 */
export function startLiveSimulation(
  setVehicles,
  setAlerts,
  setSpeedData,
  setLiveTs,
  intervalMs = 3000
) {
  const id = setInterval(() => {
    const ts = new Date();

    setVehicles(prev => {
      const updated = prev.map(v => ({ ...tickVehicle(v), _ts: ts }));

      // Update alerts based on new vehicle states
      setAlerts(prevAlerts => deriveAlerts(updated, prevAlerts));

      // Slide speed chart for V001 (first active vehicle)
      const v001 = updated.find(v => v.id === 'V001') ?? updated[0];
      setSpeedData(prev => tickSpeedData(prev, v001));

      setLiveTs(ts);
      return updated;
    });
  }, intervalMs);

  return () => clearInterval(id);
}
