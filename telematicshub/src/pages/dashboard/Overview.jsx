import { useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useData } from '../../contexts/DataContext';
import './Overview.css';

// ── Live OBD Panel (Firestore onSnapshot → vehicles/mritunjay) ──────────────
function LiveOBDPanel() {
  const [obd, setObd]         = useState(null);
  const [lastSeen, setLastSeen] = useState(null);
  const [secAgo, setSecAgo]   = useState(0);
  const [online, setOnline]   = useState(false);

  // Real-time Firestore listener
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'vehicles', 'mritunjay'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        const r = d.last_reading || {};
        setObd({
          rpm:           r.rpm           ?? 0,
          speed:         r.speed         ?? 0,
          temp:          r.temp          ?? 0,
          fuel:          r.fuel          ?? 0,
          engine_load:   r.engine_load   ?? 0,
          throttle:      r.throttle      ?? 0,
          intake_air:    r.intake_air    ?? 0,
          battery:       r.battery       ?? 0,
          alcohol_level: r.alcohol_level ?? 0,
          mq3_voltage:   r.mq3_voltage   ?? 0,
          gps_valid:     r.gps_valid     ?? false,
          latitude:      r.lat           ?? 0,
          longitude:     r.lng           ?? 0,
          altitude:      r.altitude      ?? 0,
          satellites:    r.satellites    ?? 0,
          status:        d.status        ?? 'offline',
        });
        setLastSeen(new Date());
        setOnline(true);
      } else {
        setOnline(false);
      }
    });
    return () => unsub();
  }, []);

  // Seconds-since-last-update ticker
  useEffect(() => {
    if (!lastSeen) return;
    const id = setInterval(() => {
      setSecAgo(Math.floor((Date.now() - lastSeen.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastSeen]);

  const rpmColor  = (v) => v < 3000 ? '#27ae60' : v < 6000 ? '#f39c12' : '#e74c3c';
  const spdColor  = (v) => v < 60 ? '#3ab5c8' : v < 100 ? '#27ae60' : v < 130 ? '#f39c12' : '#e74c3c';
  const tempColor = (v) => v < 60 ? '#3ab5c8' : v <= 100 ? '#27ae60' : v <= 110 ? '#f39c12' : '#e74c3c';
  const batColor  = (v) => v < 11.5 ? '#e74c3c' : v < 12.4 ? '#f39c12' : v > 14.8 ? '#f39c12' : '#27ae60';

  const alcoholLabel = (lvl) => ['Sober','Trace','Moderate','High'][lvl] || 'Unknown';
  const alcoholColor = (lvl) => ['#27ae60','#f39c12','#f97316','#e74c3c'][lvl] || '#64748b';

  const metrics = obd ? [
    { label: 'RPM',         value: obd.rpm,                        unit: 'rpm',  color: rpmColor(obd.rpm),     bar: (obd.rpm / 8000) * 100 },
    { label: 'Speed',       value: obd.speed,                      unit: 'km/h', color: spdColor(obd.speed),   bar: (obd.speed / 200) * 100 },
    { label: 'Coolant Temp',value: obd.temp,                       unit: '°C',   color: tempColor(obd.temp),   bar: null },
    { label: 'Engine Load', value: obd.engine_load,                unit: '%',    color: '#a855f7',             bar: obd.engine_load },
    { label: 'Intake Air',  value: obd.intake_air,                 unit: '°C',   color: '#06b6d4',             bar: null },
    { label: 'Fuel',        value: Math.round(obd.fuel),           unit: '%',    color: obd.fuel < 15 ? '#e74c3c' : '#eab308', bar: obd.fuel },
    { label: 'Battery',     value: Number(obd.battery).toFixed(1), unit: 'V',    color: batColor(obd.battery), bar: null },
    { label: 'Alcohol',     value: alcoholLabel(obd.alcohol_level), unit: `(${obd.mq3_voltage?.toFixed(2)}V)`, color: alcoholColor(obd.alcohol_level), bar: null },
    { label: 'GPS',         value: obd.gps_valid ? `${Number(obd.latitude).toFixed(4)}, ${Number(obd.longitude).toFixed(4)}` : 'No Fix',
                            unit: obd.gps_valid ? `${obd.satellites} sats · ${Number(obd.altitude).toFixed(0)}m` : 'Waiting…',
                            color: obd.gps_valid ? '#27ae60' : '#64748b', bar: null },
  ] : [];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(20,30,50,0.95))',
      border: online ? '1px solid rgba(39,174,96,0.35)' : '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      padding: '18px 20px',
      marginBottom: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: online
          ? 'linear-gradient(90deg,#27ae60,#3ab5c8,#a855f7)'
          : 'rgba(255,255,255,0.06)',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.2rem' }}>🚗</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
              Hyundai Venue — Live OBD Feed
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 1 }}>
              ESP32 · BT MAC 00:10:CC:4F:36:03 · Auto-updates via Firestore
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {online && (
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {secAgo}s ago
            </span>
          )}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: online ? 'rgba(39,174,96,0.12)' : 'rgba(239,68,68,0.1)',
            border: online ? '1px solid rgba(39,174,96,0.3)' : '1px solid rgba(239,68,68,0.3)',
            borderRadius: 20, padding: '3px 12px',
            fontSize: '0.73rem', fontWeight: 600,
            color: online ? '#27ae60' : '#e74c3c',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: online ? '#27ae60' : '#e74c3c',
              display: 'inline-block',
              animation: online ? 'livePulse 1.4s ease-in-out infinite' : 'none',
            }} />
            {online ? 'LIVE' : 'Waiting for ESP32…'}
          </span>
        </div>
      </div>

      {/* ── Alcohol Alert Banner ── */}
      {online && obd && obd.alcohol_level >= 2 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: obd.alcohol_level >= 3
            ? 'rgba(231,76,60,0.18)'
            : 'rgba(249,115,22,0.15)',
          border: obd.alcohol_level >= 3
            ? '2px solid rgba(231,76,60,0.7)'
            : '2px solid rgba(249,115,22,0.6)',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 14,
          animation: obd.alcohol_level >= 3 ? 'alcoholFlash 1s ease-in-out infinite' : 'none',
        }}>
          <span style={{ fontSize: '2rem', flexShrink: 0 }}>
            {obd.alcohol_level >= 3 ? '🚨' : '⚠️'}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight: 800,
              fontSize: '1rem',
              color: obd.alcohol_level >= 3 ? '#ff6b6b' : '#f97316',
              letterSpacing: '0.03em',
            }}>
              {obd.alcohol_level >= 3
                ? 'DANGER — HIGH ALCOHOL DETECTED'
                : 'WARNING — MODERATE ALCOHOL DETECTED'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: 3 }}>
              {obd.alcohol_level >= 3
                ? 'Driver may be severely impaired. Stop the vehicle immediately!'
                : 'Alcohol traces detected. Driver fitness should be verified.'}
              <span style={{
                marginLeft: 12,
                fontSize: '0.75rem',
                color: '#94a3b8',
              }}>
                MQ-3 sensor: {obd.mq3_voltage?.toFixed(2)}V · Level {obd.alcohol_level}/3
              </span>
            </div>
          </div>
          <div style={{
            background: obd.alcohol_level >= 3 ? 'rgba(231,76,60,0.25)' : 'rgba(249,115,22,0.2)',
            border: obd.alcohol_level >= 3 ? '1px solid rgba(231,76,60,0.5)' : '1px solid rgba(249,115,22,0.4)',
            borderRadius: 8,
            padding: '6px 14px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: obd.alcohol_level >= 3 ? '#ff6b6b' : '#f97316',
            flexShrink: 0,
          }}>
            {['Sober','Trace','Moderate','High'][obd.alcohol_level]}
          </div>
        </div>
      )}

      {/* ── GPS Banner (when valid fix) ── */}
      {online && obd && obd.gps_valid && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'rgba(39,174,96,0.08)',
          border: '1px solid rgba(39,174,96,0.25)',
          borderRadius: 10,
          padding: '10px 16px',
          marginBottom: 14,
          fontSize: '0.8rem',
          color: '#94a3b8',
        }}>
          <span style={{ fontSize: '1.2rem' }}>📍</span>
          <div style={{ flex: 1 }}>
            <span style={{ color: '#27ae60', fontWeight: 600 }}>GPS Fix</span>
            {' · '}
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {Number(obd.latitude).toFixed(6)}, {Number(obd.longitude).toFixed(6)}
            </span>
            <span style={{ marginLeft: 10, color: '#64748b' }}>
              {obd.satellites} satellites · {Number(obd.altitude).toFixed(0)}m alt
            </span>
          </div>
          <a
            href={`https://www.google.com/maps?q=${obd.latitude},${obd.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'rgba(39,174,96,0.15)',
              border: '1px solid rgba(39,174,96,0.35)',
              borderRadius: 6,
              padding: '4px 12px',
              color: '#27ae60',
              fontWeight: 600,
              fontSize: '0.75rem',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            Open Map ↗
          </a>
        </div>
      )}

      {/* metric tiles */}
      {online && obd ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 10,
        }}>
          {metrics.map((m, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
              padding: '12px 14px',
            }}>
              <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                {m.label}
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: m.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {m.value}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: 2 }}>{m.unit}</div>
              {m.bar !== null && (
                <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${Math.min(100, Math.max(0, m.bar))}%`,
                    background: m.color, borderRadius: 2,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#475569', fontSize: '0.85rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📡</div>
          Start the ESP32 and connect to WiFi <strong style={{ color: '#64748b' }}>OBD2_Dashboard</strong> to see live data
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="ct-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}{p.unit || ''}</p>
        ))}
      </div>
    );
  }
  return null;
};

/** Pulsing LIVE badge — counts seconds since the last simulator tick */
function LiveBadge({ liveTs }) {
  const [sec, setSec] = useState(0);

  useEffect(() => {
    if (!liveTs) return;
    setSec(0);
    const id = setInterval(() => {
      setSec(Math.floor((Date.now() - liveTs.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [liveTs]);

  if (!liveTs) return null;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'rgba(39,174,96,0.12)', border: '1px solid rgba(39,174,96,0.35)',
      borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem', fontWeight: 600,
      color: '#27ae60',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: '#27ae60',
        display: 'inline-block',
        animation: 'livePulse 1.4s ease-in-out infinite',
      }} />
      LIVE · updated {sec}s ago
    </span>
  );
}

export default function Overview() {
  const { view } = useOutletContext();
  const { vehicles, alerts, fuelTrend, tripData, recentTrips, liveTs } = useData();

  const activeCount      = vehicles.filter(v => v.status === 'active').length;
  const alertCount       = alerts.filter(a => a.resolved !== true).length;
  const maintenanceCount = vehicles.filter(v => v.status === 'maintenance').length;
  const offlineCount     = vehicles.filter(v => v.status === 'offline').length;

  const severityColor = { danger: '#e74c3c', warning: '#f39c12', info: '#2a8e9e' };

  return (
    <div className="overview-page animate-fade-in">
      {/* Page header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1>Fleet Overview</h1>
          <p>Live status and performance snapshot of your entire fleet</p>
        </div>
        <LiveBadge liveTs={liveTs} />
      </div>

      {/* ── Live OBD Panel (mritunjay / ESP32) ── */}
      <LiveOBDPanel />

      {/* Live vehicle telemetry ticker */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}>
        {vehicles.map(v => {
          const isMoving = v.status === 'active';
          const tempColor = v.temp > 100 ? '#e74c3c' : v.temp > 92 ? '#f39c12' : '#2a8e9e';
          const fuelColor = v.fuel < 15 ? '#e74c3c' : v.fuel < 30 ? '#f39c12' : '#27ae60';
          return (
            <div key={v.id} style={{
              background: 'var(--card-bg, #1a2432)',
              border: isMoving
                ? '1px solid rgba(39,174,96,0.35)'
                : '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
              padding: '12px 16px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Moving indicator stripe */}
              {isMoving && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: 3,
                  background: 'linear-gradient(90deg,#27ae60,#3ab5c8)',
                }} />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary, #e2eaf0)' }}>
                  {v.reg}
                </span>
                <span className={`badge badge-${v.status === 'active' ? 'success' : v.status === 'idle' ? 'info' : v.status === 'maintenance' ? 'warning' : 'danger'}`}>
                  {v.status}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94aab0)', marginBottom: 8 }}>
                {v.model} · {v.driver}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {/* Speed */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: isMoving ? '#3ab5c8' : '#94aab0' }}>
                    {v.speed}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94aab0' }}>km/h</div>
                </div>
                {/* Fuel */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: fuelColor }}>
                    {v.fuel}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94aab0' }}>Fuel</div>
                </div>
                {/* Temp */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: tempColor }}>
                    {v.temp}°
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94aab0' }}>Temp</div>
                </div>
              </div>
              {/* Odometer */}
              <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#94aab0', textAlign: 'right' }}>
                ODO: {(v.odometer || 0).toLocaleString()} km
              </div>
            </div>
          );
        })}
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{marginBottom:'24px'}}>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(42,142,158,0.15)', color:'#3ab5c8'}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/>
              <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
          <div className="stat-info">
            <h3>{vehicles.length}</h3>
            <p>Total Vehicles</p>
            <div className="stat-change up">↑ 1 added this month</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(39,174,96,0.15)', color:'#2ecc71'}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="stat-info">
            <h3>{activeCount}</h3>
            <p>Active Now</p>
            <div className="stat-change up">↑ On the road</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(231,76,60,0.15)', color:'#e74c3c'}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="stat-info">
            <h3>{alertCount}</h3>
            <p>Active Alerts</p>
            <div className="stat-change down">↓ Needs attention</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(243,156,18,0.15)', color:'#f39c12'}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <div className="stat-info">
            <h3>{maintenanceCount + offlineCount}</h3>
            <p>Offline / Service</p>
            <div className="stat-change down">↓ Check required</div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="overview-charts">
        {/* Fuel trend */}
        <div className="card chart-card">
          <div className="section-title">
            Fuel Levels — Last 7 Days
            <span className="chart-legend-note">By vehicle</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={fuelTrend} margin={{top:5,right:10,left:-20,bottom:0}}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2a8e9e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2a8e9e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,142,158,0.1)" />
              <XAxis dataKey="day" stroke="#94aab0" tick={{fontSize:12}} />
              <YAxis stroke="#94aab0" tick={{fontSize:12}} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="v1" name="V001" stroke="#2a8e9e" fill="url(#g1)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="v3" name="V003" stroke="#3ab5c8" fill="none" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="v5" name="V005" stroke="#f39c12" fill="none" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly trips */}
        <div className="card chart-card">
          <div className="section-title">Monthly Trips</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tripData} margin={{top:5,right:10,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,142,158,0.1)" />
              <XAxis dataKey="month" stroke="#94aab0" tick={{fontSize:12}} />
              <YAxis stroke="#94aab0" tick={{fontSize:12}} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="trips" name="Trips" fill="#2a8e9e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row: vehicles + alerts */}
      <div className="overview-bottom">
        {/* Vehicle status */}
        <div className="card">
          <div className="section-title">
            Vehicle Status
            <a href="/dashboard/vehicles" className="see-all">View all →</a>
          </div>
          <div className="vehicle-list-mini">
            {vehicles.map(v => (
              <div key={v.id} className="vehicle-mini-item">
                <div className="vehicle-mini-info">
                  <div className="vehicle-mini-reg">{v.reg}</div>
                  <div className="vehicle-mini-model">{v.model} · {v.driver}</div>
                </div>
                <div className="vehicle-mini-metrics">
                  <div className="mini-metric">
                    <span className="mini-metric-label">Fuel</span>
                    <div className="fuel-bar-wrap">
                      <div className="fuel-bar" style={{width: `${v.fuel}%`, background: v.fuel < 25 ? '#e74c3c' : v.fuel < 50 ? '#f39c12' : '#27ae60'}} />
                    </div>
                    <span className="mini-metric-val">{v.fuel}%</span>
                  </div>
                </div>
                <span className={`badge badge-${v.status === 'active' ? 'success' : v.status === 'idle' ? 'info' : v.status === 'maintenance' ? 'warning' : 'danger'}`}>
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active alerts */}
        <div className="card">
          <div className="section-title">
            Active Alerts
            <span className="badge badge-danger">{alertCount}</span>
          </div>
          <div className="alert-list">
            {alerts.filter(a => a.resolved !== true).map(a => (
              <div key={a.id} className={`alert-item alert-${a.severity}`}>
                <div className="alert-dot" style={{background: severityColor[a.severity]}} />
                <div className="alert-content">
                  <div className="alert-type">{a.alert_type || a.type}</div>
                  <div className="alert-msg">{a.message}</div>
                  <div className="alert-meta">
                    {a.vehicle_id || a.vehicleReg}
                    {' · '}
                    {a.created_at
                      ? new Date(a.created_at).toLocaleTimeString()
                      : a.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Trips */}
      <div className="card" style={{marginTop:'20px'}}>
        <div className="section-title">
          Recent Trips
          <a href="/dashboard/reports" className="see-all">View all →</a>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th><th>Driver</th><th>From → To</th>
                <th>Distance</th><th>Duration</th><th>Date</th><th>Fuel Used</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map(t => (
                <tr key={t.id}>
                  <td>{t.vehicle}</td>
                  <td>{t.driver}</td>
                  <td style={{maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.from} → {t.to}</td>
                  <td>{t.distance}</td>
                  <td>{t.duration}</td>
                  <td>{t.date}</td>
                  <td>{t.fuelUsed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
