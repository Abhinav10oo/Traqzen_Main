import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useData } from '../../contexts/DataContext';
import './VehicleList.css';

const statusColors = { active: 'success', idle: 'info', maintenance: 'warning', offline: 'danger' };

function VehicleDetailModal({ vehicle, onClose, isOwner }) {
  if (!vehicle) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{vehicle.reg}</h2>
            <p>{vehicle.model} ({vehicle.year}) · {vehicle.type}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Status & Driver */}
          <div className="modal-section">
            <div className="modal-grid">
              <div className="modal-field">
                <span className="mf-label">Status</span>
                <span className={`badge badge-${statusColors[vehicle.status]}`}>{vehicle.status}</span>
              </div>
              <div className="modal-field">
                <span className="mf-label">Driver</span>
                <span className="mf-val">{vehicle.driver}</span>
              </div>
              <div className="modal-field">
                <span className="mf-label">Speed</span>
                <span className="mf-val">{vehicle.speed} km/h</span>
              </div>
              <div className="modal-field">
                <span className="mf-label">Odometer</span>
                <span className="mf-val">{vehicle.odometer.toLocaleString()} km</span>
              </div>
            </div>
          </div>

          {/* Sensor data */}
          <div className="modal-section">
            <h3 className="modal-section-title">Sensor Data</h3>
            <div className="sensor-grid">
              <div className="sensor-card">
                <div className="sensor-icon" style={{background:'rgba(42,142,158,0.15)',color:'#3ab5c8'}}>⛽</div>
                <div className="sensor-val">{vehicle.fuel}%</div>
                <div className="sensor-lbl">Fuel Level</div>
                <div className="sensor-bar-wrap">
                  <div className="sensor-bar" style={{width:`${vehicle.fuel}%`, background: vehicle.fuel<25?'#e74c3c':vehicle.fuel<50?'#f39c12':'#27ae60'}} />
                </div>
              </div>
              <div className="sensor-card">
                <div className="sensor-icon" style={{background:'rgba(231,76,60,0.15)',color:'#e74c3c'}}>🌡️</div>
                <div className="sensor-val">{vehicle.temp}°C</div>
                <div className="sensor-lbl">Engine Temp</div>
                <div className="sensor-bar-wrap">
                  <div className="sensor-bar" style={{width:`${Math.min(vehicle.temp/110*100,100)}%`, background: vehicle.temp>90?'#e74c3c':vehicle.temp>80?'#f39c12':'#27ae60'}} />
                </div>
              </div>
            </div>
          </div>

          {/* OBD-II Live Data — only shown for Hyundai Venue */}
          {vehicle.id === 'mritunjay' && (
            <div className="modal-section">
              <h3 className="modal-section-title" style={{display:'flex',alignItems:'center',gap:8}}>
                OBD-II Live Data
                <span style={{fontSize:'0.68rem',background:'rgba(39,174,96,0.12)',border:'1px solid rgba(39,174,96,0.3)',borderRadius:10,padding:'2px 8px',color:'#27ae60',fontWeight:600}}>
                  ● LIVE
                </span>
              </h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                {[
                  { label:'RPM',         value: vehicle.rpm ?? 0,         unit:'rpm',  color: (vehicle.rpm??0)<3000?'#27ae60':(vehicle.rpm??0)<6000?'#f39c12':'#e74c3c' },
                  { label:'Engine Load', value: vehicle.engine_load ?? 0, unit:'%',    color:'#a855f7' },
                  { label:'Throttle',    value: vehicle.throttle ?? 0,    unit:'%',    color:'#f97316' },
                  { label:'Intake Air',  value: vehicle.intake_air ?? 0,  unit:'°C',   color:'#06b6d4' },
                  { label:'Battery',     value: Number(vehicle.battery??0).toFixed(1), unit:'V', color:'#14b8a6' },
                  { label:'Speed',       value: vehicle.speed ?? 0,       unit:'km/h', color:'#3b82f6' },
                ].map((m,i) => (
                  <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'10px 12px',textAlign:'center'}}>
                    <div style={{fontSize:'0.62rem',color:'#64748b',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>{m.label}</div>
                    <div style={{fontSize:'1.4rem',fontWeight:800,color:m.color,lineHeight:1}}>{m.value}</div>
                    <div style={{fontSize:'0.68rem',color:'#475569',marginTop:2}}>{m.unit}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          <div className="modal-section">
            <h3 className="modal-section-title">Location</h3>
            <div className="location-box">
              <div className="loc-coords">
                <span>📍</span> Lat: {vehicle.lat.toFixed(4)}, Lng: {vehicle.lng.toFixed(4)}
              </div>
              <div className="map-placeholder">
                <div className="map-mock">
                  <div className="map-grid-lines" />
                  <div className="map-pin">📍</div>
                  <span>Live GPS — Interactive map available with backend</span>
                </div>
              </div>
            </div>
          </div>

          {/* Documents (owner only) */}
          {isOwner && (
            <div className="modal-section">
              <h3 className="modal-section-title">Document Status</h3>
              <div className="modal-grid">
                <div className="modal-field">
                  <span className="mf-label">Insurance Expiry</span>
                  <span className={`mf-val ${new Date(vehicle.insurance) < new Date() ? 'text-danger' : ''}`}>{vehicle.insurance}</span>
                </div>
                <div className="modal-field">
                  <span className="mf-label">Pollution Cert. Expiry</span>
                  <span className={`mf-val ${new Date(vehicle.pollution) < new Date() ? 'text-danger' : ''}`}>{vehicle.pollution}</span>
                </div>
                <div className="modal-field">
                  <span className="mf-label">Last Service</span>
                  <span className="mf-val">{vehicle.lastService}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {isOwner && (
          <div className="modal-footer">
            <button className="btn btn-ghost btn-sm">Edit Vehicle</button>
            <button className="btn btn-primary btn-sm">View Full Report</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VehicleList() {
  const { view } = useOutletContext();
  const isOwner = view === 'owner';
  const { vehicles } = useData();
  const [selected,      setSelected]      = useState(null);
  const [liveOBD,       setLiveOBD]       = useState({});

  // Firestore onSnapshot — keeps mritunjay card up-to-date in real time
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'vehicles', 'mritunjay'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        const r = d.last_reading || {};
        setLiveOBD({
          status:      d.status ?? 'idle',
          speed:       Math.round(r.speed       ?? 0),
          fuel:        Math.round(r.fuel        ?? 0),
          temp:        Math.round(r.temp        ?? 0),
          rpm:         Math.round(r.rpm         ?? 0),
          engine_load: Math.round(r.engine_load ?? 0),
          throttle:    Math.round(r.throttle    ?? 0),
          intake_air:  Math.round(r.intake_air  ?? 0),
          battery:     r.battery ?? 0,
          lat:         r.lat ?? 0,
          lng:         r.lng ?? 0,
        });
      }
    });
    return () => unsub();
  }, []);

  // Merge live OBD data into the mritunjay entry
  const displayVehicles = vehicles.map(v =>
    v.id === 'mritunjay' ? { ...v, ...liveOBD } : v
  );
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = displayVehicles.filter(v => {
    const matchStatus = filter === 'all' || v.status === filter;
    const matchSearch = v.reg.toLowerCase().includes(search.toLowerCase()) ||
                        v.model.toLowerCase().includes(search.toLowerCase()) ||
                        v.driver.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <h1>Vehicle List</h1>
          <p>{isOwner ? 'Manage and monitor all registered vehicles' : 'View your assigned vehicle status'}</p>
        </div>
        {isOwner && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Vehicle
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="vehicle-filters">
        <div className="filter-tabs">
          {['all','active','idle','maintenance','offline'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="filter-count">
                {f === 'all' ? displayVehicles.length : displayVehicles.filter(v => v.status === f).length}
              </span>
            </button>
          ))}
        </div>
        <div className="vehicle-search">
          <input
            type="text"
            placeholder="Search vehicles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Vehicle cards */}
      <div className="vehicles-grid">
        {filtered.map(v => (
          <div key={v.id} className="vehicle-card" onClick={() => setSelected(v)}>
            <div className="vc-header">
              <div>
                <div className="vc-reg">{v.reg}</div>
                <div className="vc-model">{v.model} · {v.year}</div>
              </div>
              <span className={`badge badge-${statusColors[v.status]}`}>{v.status}</span>
            </div>

            <div className="vc-driver">
              <div className="vc-driver-avatar">{v.driver.split(' ').map(n=>n[0]).join('')}</div>
              <div>
                <div className="vc-driver-name">{v.driver}</div>
                <div className="vc-driver-label">Assigned Driver</div>
              </div>
            </div>

            <div className="vc-metrics">
              <div className="vc-metric">
                <div className="vc-metric-label">Fuel</div>
                <div className="vc-metric-bar">
                  <div style={{width:`${v.fuel}%`, background: v.fuel<25?'#e74c3c':v.fuel<50?'#f39c12':'#27ae60', height:'100%', borderRadius:'2px'}} />
                </div>
                <div className="vc-metric-val">{v.fuel}%</div>
              </div>
              <div className="vc-metric">
                <div className="vc-metric-label">Temp</div>
                <div className="vc-metric-bar">
                  <div style={{width:`${Math.min(v.temp/110*100,100)}%`, background: v.temp>90?'#e74c3c':v.temp>80?'#f39c12':'#27ae60', height:'100%', borderRadius:'2px'}} />
                </div>
                <div className="vc-metric-val">{v.temp}°C</div>
              </div>
            </div>

            <div className="vc-footer">
              <span className="vc-speed">{v.speed > 0 ? `🟢 ${v.speed} km/h` : '⚪ Stopped'}</span>
              <span className="vc-odo">📍 {v.odometer.toLocaleString()} km</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🚗</div>
          <h3>No vehicles found</h3>
          <p>Try adjusting your filters or search term</p>
        </div>
      )}

      {/* Add Vehicle Modal (owner only) */}
      {showAddModal && isOwner && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" style={{maxWidth:'500px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Vehicle</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                <div className="form-group"><label>Registration Number</label><input type="text" placeholder="MH 12 AB 1234" /></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                  <div className="form-group"><label>Vehicle Model</label><input type="text" placeholder="Tata Nexon" /></div>
                  <div className="form-group"><label>Year</label><input type="number" placeholder="2023" /></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                  <div className="form-group"><label>Type</label><select><option>SUV</option><option>Hatchback</option><option>Sedan</option><option>MPV</option><option>Van</option><option>Truck</option></select></div>
                  <div className="form-group"><label>Assign Driver</label><select><option>— Select —</option><option>Arjun Sharma</option><option>Priya Nair</option><option>Ravi Kumar</option></select></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                  <div className="form-group"><label>Insurance Expiry</label><input type="date" /></div>
                  <div className="form-group"><label>Pollution Expiry</label><input type="date" /></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(false)}>Add Vehicle</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      <VehicleDetailModal vehicle={selected} onClose={() => setSelected(null)} isOwner={isOwner} />
    </div>
  );
}
