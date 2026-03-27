import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';

const statusColors = { upcoming: 'warning', overdue: 'danger', completed: 'success' };

export default function Maintenance() {
  const { view } = useOutletContext();
  const isOwner = view === 'owner';
  const { maintenance, vehicles } = useData();
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = filter === 'all' ? maintenance : maintenance.filter(m => m.status === filter);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <h1>Maintenance</h1>
          <p>Track and schedule vehicle service and maintenance tasks</p>
        </div>
        {isOwner && (
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Task</button>
        )}
      </div>

      {/* Summary */}
      <div className="grid-3" style={{marginBottom:'24px'}}>
        {[
          { label: 'Overdue',  count: maintenance.filter(m=>m.status==='overdue').length,   color: '#e74c3c', icon: '🔴' },
          { label: 'Upcoming', count: maintenance.filter(m=>m.status==='upcoming').length,  color: '#f39c12', icon: '🟡' },
          { label: 'Completed',count: maintenance.filter(m=>m.status==='completed').length, color: '#27ae60', icon: '🟢' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{cursor:'pointer'}} onClick={() => setFilter(s.label.toLowerCase())}>
            <div style={{fontSize:'1.8rem'}}>{s.icon}</div>
            <div className="stat-info">
              <h3 style={{color: s.color}}>{s.count}</h3>
              <p>{s.label} Tasks</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{display:'flex',gap:'8px',marginBottom:'20px',flexWrap:'wrap'}}>
        {['all','overdue','upcoming','completed'].map(f => (
          <button key={f} className={`filter-tab ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="filter-count">{f==='all'?maintenance.length:maintenance.filter(m=>m.status===f).length}</span>
          </button>
        ))}
      </div>

      {/* Maintenance list */}
      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
        {filtered.map(m => (
          <div key={m.id} className="card" style={{display:'flex',alignItems:'center',gap:'16px',padding:'16px 20px'}}>
            <div style={{
              width:44, height:44, borderRadius:10, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
              background: m.status==='overdue' ? 'rgba(231,76,60,0.15)' : m.status==='upcoming' ? 'rgba(243,156,18,0.15)' : 'rgba(39,174,96,0.15)',
              fontSize: '1.3rem'
            }}>
              {m.status==='overdue' ? '🔴' : m.status==='upcoming' ? '🔧' : '✅'}
            </div>

            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                <span style={{fontWeight:700,color:'var(--white)',fontSize:'0.95rem'}}>{m.type}</span>
                <span className={`badge badge-${statusColors[m.status]}`}>{m.status}</span>
              </div>
              <div style={{fontSize:'0.82rem',color:'var(--mid-gray)',marginTop:'3px'}}>{m.vehicle} · {m.notes}</div>
            </div>

            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontSize:'0.84rem',color: m.status==='overdue'?'#e74c3c':m.status==='upcoming'?'#f39c12':'#27ae60',fontWeight:600}}>
                {m.status === 'overdue' ? '⚠ Overdue' : m.status === 'completed' ? '✓ Done'  : `Due: ${m.dueDate}`}
              </div>
              <div style={{fontSize:'0.8rem',color:'var(--mid-gray)',marginTop:'2px'}}>
                Est. Cost: ₹{m.cost.toLocaleString()}
              </div>
            </div>

            {isOwner && (
              <div style={{display:'flex',gap:'6px',flexShrink:0}}>
                {m.status !== 'completed' && (
                  <button className="btn btn-success btn-xs">Mark Done</button>
                )}
                <button className="btn btn-ghost btn-xs">Edit</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add modal */}
      {showAdd && isOwner && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" style={{maxWidth:'480px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Maintenance Task</h2>
              <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                <div className="form-group">
                  <label>Vehicle</label>
                  <select>
                    <option>— Select Vehicle —</option>
                    {vehicles.map(v=><option key={v.id}>{v.reg} — {v.model}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Maintenance Type</label>
                  <input type="text" placeholder="e.g. Oil Change, Tire Replacement" />
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input type="date" />
                  </div>
                  <div className="form-group">
                    <label>Estimated Cost (₹)</label>
                    <input type="number" placeholder="0" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea placeholder="Additional details..." />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(false)}>Add Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
