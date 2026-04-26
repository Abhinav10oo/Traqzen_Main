import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { doc, collection, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import './VehicleList.css';

const statusColors = { active: 'success', idle: 'info', maintenance: 'warning', offline: 'danger' };

// ── Edit Vehicle Modal ────────────────────────────────────────────────────────
function EditVehicleModal({ vehicle, onClose, onSaved }) {
  const [form, setForm] = useState({
    reg:         vehicle.reg         || '',
    model:       vehicle.model       || '',
    year:        vehicle.year        || '',
    type:        vehicle.type        || 'SUV',
    driver:      vehicle.driver      || '',
    odometer:    vehicle.odometer    || 0,
    insurance:   vehicle.insurance   || '',
    pollution:   vehicle.pollution   || '',
    lastService: vehicle.lastService || '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await updateDoc(doc(db, 'vehicles', 'mritunjay'), {
        reg:         form.reg,
        model:       form.model,
        year:        Number(form.year),
        type:        form.type,
        driver:      form.driver,
        odometer:    Number(form.odometer),
        insurance:   form.insurance,
        pollution:   form.pollution,
        lastService: form.lastService,
      });
      onSaved(form);
      onClose();
    } catch (e) {
      setError('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Vehicle</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label>Registration / Name</label>
                <input value={form.reg} onChange={e => set('reg', e.target.value)} placeholder="Hyundai Venue" />
              </div>
              <div className="form-group">
                <label>Model</label>
                <input value={form.model} onChange={e => set('model', e.target.value)} placeholder="Hyundai Venue" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label>Year</label>
                <input type="number" value={form.year} onChange={e => set('year', e.target.value)} placeholder="2024" />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={e => set('type', e.target.value)}>
                  <option>SUV</option><option>Hatchback</option><option>Sedan</option>
                  <option>MPV</option><option>Van</option><option>Truck</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label>Driver Name</label>
                <input value={form.driver} onChange={e => set('driver', e.target.value)} placeholder="Driver name" />
              </div>
              <div className="form-group">
                <label>Odometer (km)</label>
                <input type="number" value={form.odometer} onChange={e => set('odometer', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label>Insurance Expiry</label>
                <input type="date" value={form.insurance} onChange={e => set('insurance', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Pollution Expiry</label>
                <input type="date" value={form.pollution} onChange={e => set('pollution', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Last Service Date</label>
              <input type="date" value={form.lastService} onChange={e => set('lastService', e.target.value)} />
            </div>
            {error && <div style={{ color: '#e74c3c', fontSize: '0.82rem' }}>{error}</div>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Vehicle Detail Modal ──────────────────────────────────────────────────────
function VehicleDetailModal({ vehicle, onClose, isOwner, onEdit }) {
  const navigate = useNavigate();
  if (!vehicle) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{vehicle.reg || vehicle.name || 'Hyundai Venue'}</h2>
            <p>{vehicle.model || 'Hyundai Venue'} ({vehicle.year || '—'}) · {vehicle.type || 'SUV'}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Status & Driver */}
          <div className="modal-section">
            <div className="modal-grid">
              <div className="modal-field">
                <span className="mf-label">Status</span>
                <span className={`badge badge-${statusColors[vehicle.status] || 'info'}`}>{vehicle.status || 'idle'}</span>
              </div>
              <div className="modal-field">
                <span className="mf-label">Driver</span>
                <span className="mf-val">{vehicle.driver || '—'}</span>
              </div>
              <div className="modal-field">
                <span className="mf-label">Speed</span>
                <span className="mf-val">{vehicle.speed || 0} km/h</span>
              </div>
              <div className="modal-field">
                <span className="mf-label">Odometer</span>
                <span className="mf-val">{(vehicle.odometer || 0).toLocaleString()} km</span>
              </div>
            </div>
          </div>

          {/* Sensor data */}
          <div className="modal-section">
            <h3 className="modal-section-title">Sensor Data</h3>
            <div className="sensor-grid">
              <div className="sensor-card">
                <div className="sensor-icon" style={{background:'rgba(42,142,158,0.15)',color:'#3ab5c8'}}>⛽</div>
                <div className="sensor-val">{vehicle.fuel || 0}%</div>
                <div className="sensor-lbl">Fuel Level</div>
                <div className="sensor-bar-wrap">
                  <div className="sensor-bar" style={{width:`${vehicle.fuel||0}%`, background: (vehicle.fuel||0)<25?'#e74c3c':(vehicle.fuel||0)<50?'#f39c12':'#27ae60'}} />
                </div>
              </div>
              <div className="sensor-card">
                <div className="sensor-icon" style={{background:'rgba(231,76,60,0.15)',color:'#e74c3c'}}>🌡️</div>
                <div className="sensor-val">{vehicle.temp || 0}°C</div>
                <div className="sensor-lbl">Engine Temp</div>
                <div className="sensor-bar-wrap">
                  <div className="sensor-bar" style={{width:`${Math.min((vehicle.temp||0)/110*100,100)}%`, background: (vehicle.temp||0)>90?'#e74c3c':(vehicle.temp||0)>80?'#f39c12':'#27ae60'}} />
                </div>
              </div>
            </div>
          </div>

          {/* OBD-II Live Data */}
          {(vehicle.id === 'mritunjay' || vehicle._docId === 'mritunjay') && (
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
                  { label:'Intake Air',  value: vehicle.intake_air ?? 0,  unit:'°C',   color:'#06b6d4' },
                  { label:'Battery',     value: Number(vehicle.battery??0).toFixed(1), unit:'V', color:'#14b8a6' },
                  { label:'Speed',       value: vehicle.speed ?? 0,       unit:'km/h', color:'#3b82f6' },
                  { label:'Alcohol',
                    value: ['Sober','Trace','Moderate','High'][vehicle.alcohol_level??0] || 'Sober',
                    unit: `${Number(vehicle.mq3_voltage??0).toFixed(2)}V`,
                    color: (vehicle.alcohol_level??0)===0?'#27ae60':(vehicle.alcohol_level??0)===1?'#f39c12':(vehicle.alcohol_level??0)===2?'#f97316':'#e74c3c' },
                  { label:'GPS',
                    value: vehicle.gps_valid ? `${Number(vehicle.lat??0).toFixed(4)}` : 'No Fix',
                    unit: vehicle.gps_valid ? `${Number(vehicle.lng??0).toFixed(4)} · ${vehicle.satellites??0} sats` : 'Waiting…',
                    color: vehicle.gps_valid ? '#27ae60' : '#64748b' },
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
                <span>📍</span> Lat: {(vehicle.lat || 0).toFixed(4)}, Lng: {(vehicle.lng || 0).toFixed(4)}
              </div>
              {vehicle.gps_valid && (
                <a
                  href={`https://www.google.com/maps?q=${vehicle.lat},${vehicle.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{display:'inline-block',marginTop:8,fontSize:'0.8rem',color:'#27ae60',textDecoration:'none',fontWeight:600}}
                >
                  Open in Google Maps ↗
                </a>
              )}
              {!vehicle.gps_valid && (
                <div className="map-placeholder">
                  <div className="map-mock">
                    <div className="map-grid-lines" />
                    <div className="map-pin">📍</div>
                    <span>Waiting for GPS fix…</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Documents (owner only) */}
          {isOwner && (
            <div className="modal-section">
              <h3 className="modal-section-title">Document Status</h3>
              <div className="modal-grid">
                <div className="modal-field">
                  <span className="mf-label">Insurance Expiry</span>
                  <span className={`mf-val ${vehicle.insurance && new Date(vehicle.insurance) < new Date() ? 'text-danger' : ''}`}>
                    {vehicle.insurance || '—'}
                  </span>
                </div>
                <div className="modal-field">
                  <span className="mf-label">Pollution Cert. Expiry</span>
                  <span className={`mf-val ${vehicle.pollution && new Date(vehicle.pollution) < new Date() ? 'text-danger' : ''}`}>
                    {vehicle.pollution || '—'}
                  </span>
                </div>
                <div className="modal-field">
                  <span className="mf-label">Last Service</span>
                  <span className="mf-val">{vehicle.lastService || '—'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {isOwner && (
          <div className="modal-footer">
            <button className="btn btn-ghost btn-sm" onClick={() => { onClose(); onEdit(vehicle); }}>
              Edit Vehicle
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => { onClose(); navigate('/dashboard/reports'); }}>
              View Full Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function VehicleList() {
  const { view } = useOutletContext();
  const isOwner = view === 'owner';
  const { userProfile } = useAuth();
  const assignedVehicle = userProfile?.assignedVehicle || '';
  const { vehicles } = useData();

  // Resolve assigned vehicle by ID or registration number, fallback to mritunjay
  const resolvedAssigned = (() => {
    if (!assignedVehicle) return 'mritunjay';
    const av = assignedVehicle.replace(/\s+/g, '').toLowerCase();
    const match = vehicles.find(v => {
      const vid = v._docId || v.id;
      const reg = (v.reg || '').replace(/\s+/g, '').toLowerCase();
      return vid === assignedVehicle || reg === av;
    });
    return match ? (match._docId || match.id) : 'mritunjay';
  })();
  const [selected,     setSelected]     = useState(null);
  const [editTarget,   setEditTarget]   = useState(null);
  const [liveOBD,      setLiveOBD]      = useState({});

  // Real-time Firestore listener for mritunjay
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'vehicles', 'mritunjay'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        const r = d.last_reading || {};
        setLiveOBD({
          status:        d.status         ?? 'idle',
          speed:         Math.round(r.speed       ?? 0),
          fuel:          Math.round(r.fuel        ?? 0),
          temp:          Math.round(r.temp        ?? 0),
          rpm:           Math.round(r.rpm         ?? 0),
          engine_load:   Math.round(r.engine_load ?? 0),
          intake_air:    Math.round(r.intake_air  ?? 0),
          battery:       r.battery       ?? 0,
          lat:           r.lat           ?? 0,
          lng:           r.lng           ?? 0,
          alcohol_level: r.alcohol_level ?? 0,
          mq3_voltage:   r.mq3_voltage   ?? 0,
          gps_valid:     r.gps_valid     ?? false,
          altitude:      r.altitude      ?? 0,
          satellites:    r.satellites    ?? 0,
          // Also pick up any edited display fields saved to Firestore
          reg:         d.reg         || undefined,
          model:       d.model       || undefined,
          year:        d.year        || undefined,
          driver:      d.driver      || undefined,
          odometer:    d.odometer    || undefined,
          insurance:   d.insurance   || undefined,
          pollution:   d.pollution   || undefined,
          lastService: d.lastService || undefined,
        });
      }
    });
    return () => unsub();
  }, []);

  // Merge live OBD data into the mritunjay entry (undefined values don't overwrite)
  const displayVehicles = vehicles.map(v => {
    if ((v._docId || v.id) === 'mritunjay') {
      const merged = { ...v };
      Object.entries(liveOBD).forEach(([k, val]) => {
        if (val !== undefined) merged[k] = val;
      });
      return merged;
    }
    return v;
  });

  const [filter,       setFilter]       = useState('all');
  const [search,       setSearch]       = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm,      setAddForm]      = useState({ reg:'', model:'', year:'', type:'SUV', driver:'', insurance:'', pollution:'', lastService:'' });
  const [addSaving,    setAddSaving]    = useState(false);
  const [addError,     setAddError]     = useState('');

  const setAdd = (k, v) => setAddForm(f => ({ ...f, [k]: v }));

  async function handleAddVehicle() {
    if (!addForm.reg.trim()) { setAddError('Registration number is required.'); return; }
    if (!addForm.model.trim()) { setAddError('Vehicle model is required.'); return; }
    setAddSaving(true);
    setAddError('');
    try {
      const id = addForm.reg.trim().toLowerCase().replace(/\s+/g, '_');
      await setDoc(doc(db, 'vehicles', id), {
        id,
        reg:         addForm.reg.trim(),
        model:       addForm.model.trim(),
        year:        Number(addForm.year) || new Date().getFullYear(),
        type:        addForm.type,
        driver:      addForm.driver.trim(),
        insurance:   addForm.insurance,
        pollution:   addForm.pollution,
        lastService: addForm.lastService,
        status:      'idle',
        fuel:        0, temp: 0, speed: 0, odometer: 0,
        lat: 0, lng: 0,
      });
      setAddForm({ reg:'', model:'', year:'', type:'SUV', driver:'', insurance:'', pollution:'', lastService:'' });
      setShowAddModal(false);
    } catch (e) {
      setAddError('Failed to add vehicle: ' + e.message);
    } finally {
      setAddSaving(false);
    }
  }

  const filtered = displayVehicles.filter(v => {
    // Drivers can only see their assigned vehicle
    if (!isOwner && (v._docId || v.id) !== resolvedAssigned) return false;
    const matchStatus = filter === 'all' || v.status === filter;
    const matchSearch = (v.reg || v.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (v.model || '').toLowerCase().includes(search.toLowerCase()) ||
                        (v.driver || '').toLowerCase().includes(search.toLowerCase());
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
                {(() => {
                const scopedVehicles = isOwner ? displayVehicles : displayVehicles.filter(v => (v._docId || v.id) === resolvedAssigned);
                return f === 'all' ? scopedVehicles.length : scopedVehicles.filter(v => v.status === f).length;
              })()}
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
          <div key={v._docId || v.id} className="vehicle-card" onClick={() => setSelected(v)}>
            <div className="vc-header">
              <div>
                <div className="vc-reg">{v.reg || v.name || 'Hyundai Venue'}</div>
                <div className="vc-model">{v.model || 'Hyundai Venue'} · {v.year || '—'}</div>
              </div>
              <span className={`badge badge-${statusColors[v.status] || 'info'}`}>{v.status || 'idle'}</span>
            </div>

            <div className="vc-driver">
              <div className="vc-driver-avatar">{(v.driver || 'N A').split(' ').map(n=>n[0]).join('')}</div>
              <div>
                <div className="vc-driver-name">{v.driver || 'Not assigned'}</div>
                <div className="vc-driver-label">Assigned Driver</div>
              </div>
            </div>

            <div className="vc-metrics">
              <div className="vc-metric">
                <div className="vc-metric-label">Fuel</div>
                <div className="vc-metric-bar">
                  <div style={{width:`${v.fuel||0}%`, background: (v.fuel||0)<25?'#e74c3c':(v.fuel||0)<50?'#f39c12':'#27ae60', height:'100%', borderRadius:'2px'}} />
                </div>
                <div className="vc-metric-val">{v.fuel||0}%</div>
              </div>
              <div className="vc-metric">
                <div className="vc-metric-label">Temp</div>
                <div className="vc-metric-bar">
                  <div style={{width:`${Math.min((v.temp||0)/110*100,100)}%`, background: (v.temp||0)>90?'#e74c3c':(v.temp||0)>80?'#f39c12':'#27ae60', height:'100%', borderRadius:'2px'}} />
                </div>
                <div className="vc-metric-val">{v.temp||0}°C</div>
              </div>
            </div>

            <div className="vc-footer">
              <span className="vc-speed">{(v.speed||0) > 0 ? `🟢 ${v.speed} km/h` : '⚪ Stopped'}</span>
              <span className="vc-odo">📍 {(v.odometer || 0).toLocaleString()} km</span>
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

      {/* Add Vehicle Modal */}
      {showAddModal && isOwner && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" style={{maxWidth:'500px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Vehicle</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                <div className="form-group">
                  <label>Registration Number *</label>
                  <input type="text" placeholder="MH 12 AB 1234" value={addForm.reg} onChange={e => setAdd('reg', e.target.value)} />
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                  <div className="form-group">
                    <label>Vehicle Model *</label>
                    <input type="text" placeholder="Tata Nexon" value={addForm.model} onChange={e => setAdd('model', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Year</label>
                    <input type="number" placeholder="2024" value={addForm.year} onChange={e => setAdd('year', e.target.value)} />
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                  <div className="form-group">
                    <label>Type</label>
                    <select value={addForm.type} onChange={e => setAdd('type', e.target.value)}>
                      <option>SUV</option><option>Hatchback</option><option>Sedan</option>
                      <option>MPV</option><option>Van</option><option>Truck</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Assign Driver</label>
                    <input type="text" placeholder="Driver name" value={addForm.driver} onChange={e => setAdd('driver', e.target.value)} />
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                  <div className="form-group">
                    <label>Insurance Expiry</label>
                    <input type="date" value={addForm.insurance} onChange={e => setAdd('insurance', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Pollution Expiry</label>
                    <input type="date" value={addForm.pollution} onChange={e => setAdd('pollution', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Last Service Date</label>
                  <input type="date" value={addForm.lastService} onChange={e => setAdd('lastService', e.target.value)} />
                </div>
                {addError && <div style={{color:'#e74c3c',fontSize:'0.82rem'}}>{addError}</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)} disabled={addSaving}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleAddVehicle} disabled={addSaving}>
                {addSaving ? 'Adding…' : 'Add Vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      <VehicleDetailModal
        vehicle={selected}
        onClose={() => setSelected(null)}
        isOwner={isOwner}
        onEdit={(v) => setEditTarget(v)}
      />

      {/* Edit modal */}
      {editTarget && (
        <EditVehicleModal
          vehicle={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
