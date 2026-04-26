import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const statusColors = { valid: 'success', 'expiring-soon': 'warning', expired: 'danger' };
const statusLabels = { valid: 'Valid', 'expiring-soon': 'Expiring Soon', expired: 'Expired' };

export default function Documents() {
  const { view } = useOutletContext();
  const isOwner = view === 'owner';
  const { userProfile } = useAuth();
  const assignedVehicle = userProfile?.assignedVehicle || '';
  const { documents, vehicles } = useData();
  const [filter, setFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');

  // Resolve driver's assigned vehicle by ID or reg, fallback to mritunjay
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

  // Drivers only see documents for their assigned vehicle
  const scopedDocuments = isOwner
    ? documents
    : documents.filter(d => d.vehicleId === resolvedAssigned);

  const filtered = scopedDocuments.filter(d => {
    const matchStatus  = filter === 'all' || d.status === filter;
    const matchVehicle = !isOwner || vehicleFilter === 'all' || d.vehicleId === vehicleFilter;
    return matchStatus && matchVehicle;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <h1>Documents</h1>
          <p>Insurance, pollution certificates and compliance documents</p>
        </div>
        {isOwner && (
          <Link to="/dashboard/upload" className="btn btn-primary">
            + Upload Document
          </Link>
        )}
      </div>

      {/* Summary */}
      <div className="grid-3" style={{marginBottom:'24px'}}>
        {[
          { label: 'Valid',         count: scopedDocuments.filter(d=>d.status==='valid').length,          color:'#27ae60', icon:'✅' },
          { label: 'Expiring Soon', count: scopedDocuments.filter(d=>d.status==='expiring-soon').length,  color:'#f39c12', icon:'⏳' },
          { label: 'Expired',       count: scopedDocuments.filter(d=>d.status==='expired').length,        color:'#e74c3c', icon:'❌' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{cursor:'pointer'}} onClick={() => setFilter(s.label.toLowerCase().replace(' ','-'))}>
            <div style={{fontSize:'1.8rem'}}>{s.icon}</div>
            <div className="stat-info">
              <h3 style={{color:s.color}}>{s.count}</h3>
              <p>{s.label} Documents</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:'12px',marginBottom:'20px',flexWrap:'wrap',alignItems:'center'}}>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
          {['all','valid','expiring-soon','expired'].map(f => (
            <button key={f} className={`filter-tab ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
              {f==='all'?'All':statusLabels[f]||f}
              <span className="filter-count">{f==='all'?scopedDocuments.length:scopedDocuments.filter(d=>d.status===f).length}</span>
            </button>
          ))}
        </div>
        {isOwner && <select
          style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(42,142,158,0.15)',borderRadius:8,padding:'8px 12px',color:'var(--text-light)',fontSize:'0.84rem'}}
          value={vehicleFilter}
          onChange={e=>setVehicleFilter(e.target.value)}
        >
          <option value="all">All Vehicles</option>
          {vehicles.map(v=><option key={v.id} value={v.id}>{v.reg}</option>)}
        </select>}
      </div>

      {/* Documents grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:'16px'}}>
        {filtered.map(doc => (
          <div key={doc.id} className="card" style={{borderLeft:`3px solid ${doc.status==='expired'?'#e74c3c':doc.status==='expiring-soon'?'#f39c12':'#27ae60'}`}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'12px'}}>
              <div>
                <div style={{fontSize:'0.95rem',fontWeight:700,color:'var(--white)'}}>{doc.type}</div>
                <div style={{fontSize:'0.8rem',color:'var(--mid-gray)',marginTop:'2px'}}>{doc.vehicle}</div>
              </div>
              <span className={`badge badge-${statusColors[doc.status]}`}>{statusLabels[doc.status]}</span>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {[
                {label:'Issued By', val: doc.issuer},
                {label:'Issue Date', val: doc.issueDate},
                {label:'Expiry Date', val: doc.expiryDate, highlight: doc.status !== 'valid'},
              ].map((r,i) => (
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'0.78rem',color:'var(--mid-gray)'}}>{r.label}</span>
                  <span style={{fontSize:'0.84rem',color:r.highlight?(doc.status==='expired'?'#e74c3c':'#f39c12'):'var(--text-light)',fontWeight:r.highlight?600:400}}>
                    {r.val}
                  </span>
                </div>
              ))}
            </div>

            {isOwner && (
              <div style={{display:'flex',gap:'8px',marginTop:'14px',paddingTop:'12px',borderTop:'1px solid rgba(42,142,158,0.1)'}}>
                <button className="btn btn-ghost btn-xs" style={{flex:1}}>📄 View</button>
                <button className="btn btn-ghost btn-xs" style={{flex:1}}>📥 Download</button>
                {doc.status !== 'valid' && (
                  <Link to="/dashboard/upload" className="btn btn-primary btn-xs" style={{flex:1,justifyContent:'center'}}>Renew</Link>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No documents found</h3>
          <p>Adjust filters or upload new documents</p>
        </div>
      )}
    </div>
  );
}
