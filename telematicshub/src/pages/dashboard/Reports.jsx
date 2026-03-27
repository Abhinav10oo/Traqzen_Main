import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import './Reports.css';

export default function Reports() {
  const { recentTrips, vehicles, drivers } = useData();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('all');

  const trips = recentTrips;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <h1>Reports</h1>
          <p>Trip history, distance logs and fleet activity reports</p>
        </div>
        <div style={{display:'flex',gap:'10px'}}>
          <button className="btn btn-ghost btn-sm">📥 Export CSV</button>
          <button className="btn btn-ghost btn-sm">📄 Export PDF</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid-4" style={{marginBottom:'24px'}}>
        {[
          { label: 'Total Trips',    value: '67', icon: '🚗', color: '#2a8e9e' },
          { label: 'Total Distance', value: '4,380 km', icon: '📍', color: '#27ae60' },
          { label: 'Fuel Consumed',  value: '308 L', icon: '⛽', color: '#f39c12' },
          { label: 'Avg Trip Dist.', value: '65.4 km', icon: '📊', color: '#3ab5c8' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{fontSize:'1.6rem'}}>{s.icon}</div>
            <div className="stat-info">
              <h3 style={{fontSize:'1.3rem',color:s.color}}>{s.value}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{marginBottom:'20px'}}>
        <div className="reports-filters">
          <div className="form-group" style={{flex:1}}>
            <label>Vehicle</label>
            <select value={selectedVehicle} onChange={e=>setSelectedVehicle(e.target.value)}>
              <option value="all">All Vehicles</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.reg} — {v.model}</option>)}
            </select>
          </div>
          <div className="form-group" style={{flex:1}}>
            <label>From Date</label>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{flex:1}}>
            <label>To Date</label>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
          </div>
          <div style={{display:'flex',alignItems:'flex-end'}}>
            <button className="btn btn-primary btn-sm">Apply Filters</button>
          </div>
        </div>
      </div>

      {/* Trip table */}
      <div className="card">
        <div className="section-title">Trip Log ({trips.length} records)</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>From</th>
                <th>To</th>
                <th>Distance</th>
                <th>Duration</th>
                <th>Avg Speed</th>
                <th>Fuel Used</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t, i) => (
                <tr key={t.id}>
                  <td style={{color:'var(--mid-gray)'}}>{i+1}</td>
                  <td style={{fontWeight:600,color:'var(--white)'}}>{t.vehicle}</td>
                  <td>{t.driver}</td>
                  <td>{t.from}</td>
                  <td>{t.to}</td>
                  <td style={{color:'var(--primary-light)'}}>{t.distance}</td>
                  <td>{t.duration}</td>
                  <td>{t.avgSpeed}</td>
                  <td>{t.fuelUsed}</td>
                  <td>{t.date}</td>
                  <td>
                    <button className="btn btn-ghost btn-xs">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver summary */}
      <div className="card" style={{marginTop:'20px'}}>
        <div className="section-title">Driver Summary — This Month</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Driver</th><th>Trips</th><th>Driving Score</th><th>Status</th><th>Vehicle</th><th>License Expiry</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(d => (
                <tr key={d.id}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,var(--primary),var(--dark))',color:'white',fontSize:'0.65rem',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {d.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      {d.name}
                    </div>
                  </td>
                  <td>{d.trips}</td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <div style={{width:60,height:5,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${d.score}%`,background:d.score>=90?'#27ae60':d.score>=80?'#2a8e9e':d.score>=70?'#f39c12':'#e74c3c',borderRadius:3}} />
                      </div>
                      <span style={{fontSize:'0.84rem',fontWeight:600,color:d.score>=90?'#27ae60':d.score>=80?'#3ab5c8':d.score>=70?'#f39c12':'#e74c3c'}}>{d.score}</span>
                    </div>
                  </td>
                  <td><span className={`badge badge-${d.status==='active'?'success':d.status==='on-leave'?'warning':'gray'}`}>{d.status}</span></td>
                  <td style={{color:'var(--mid-gray)'}}>{d.assignedVehicle}</td>
                  <td style={{color: new Date(d.licenseExpiry) < new Date() ? '#e74c3c' : 'var(--text-light)'}}>{d.licenseExpiry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
