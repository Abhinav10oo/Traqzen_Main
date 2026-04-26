import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useOutletContext } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import './Reports.css';

// ── Trip Detail Modal ─────────────────────────────────────────────────────────
function TripDetailModal({ trip, onClose }) {
  if (!trip) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Trip Details</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-section">
            <div className="modal-grid">
              {[
                { label: 'Trip ID',    value: trip.id },
                { label: 'Vehicle',    value: trip.vehicle },
                { label: 'Driver',     value: trip.driver },
                { label: 'Date',       value: trip.date },
                { label: 'From',       value: trip.from },
                { label: 'To',         value: trip.to },
                { label: 'Distance',   value: trip.distance },
                { label: 'Duration',   value: trip.duration },
                { label: 'Avg Speed',  value: trip.avgSpeed },
                { label: 'Fuel Used',  value: trip.fuelUsed },
              ].map((f, i) => (
                <div key={i} className="modal-field">
                  <span className="mf-label">{f.label}</span>
                  <span className="mf-val" style={{ color: '#e2e8f0' }}>{f.value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Reports() {
  const { view } = useOutletContext();
  const isOwner = view === 'owner';
  const { userProfile } = useAuth();
  const assignedVehicle = userProfile?.assignedVehicle || '';

  const { recentTrips, vehicles, drivers, documents } = useData();
  const [dateFrom,         setDateFrom]         = useState('');
  const [dateTo,           setDateTo]           = useState('');
  const [selectedVehicle,  setSelectedVehicle]  = useState('all');
  const [viewTrip,         setViewTrip]         = useState(null);
  const [dismissDocAlert,  setDismissDocAlert]  = useState(false);

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
  const resolvedReg = vehicles.find(v => (v._docId || v.id) === resolvedAssigned)?.reg || '';

  // Drivers can only see their assigned vehicle's trips
  const scopedTrips = isOwner
    ? recentTrips
    : recentTrips.filter(t =>
        t.vehicleId === resolvedAssigned ||
        t.vehicle === resolvedReg ||
        t.vehicle === resolvedAssigned
      );

  // Filter trips
  const filteredTrips = scopedTrips.filter(t => {
    if (isOwner && selectedVehicle !== 'all' && t.vehicle !== selectedVehicle) return false;
    if (dateFrom && t.date < dateFrom) return false;
    if (dateTo   && t.date > dateTo)   return false;
    return true;
  });

  // ── Export CSV ──────────────────────────────────────────────────────────────
  function exportCSV() {
    const headers = ['#', 'Vehicle', 'Driver', 'From', 'To', 'Distance', 'Duration', 'Avg Speed', 'Fuel Used', 'Date'];
    const rows = filteredTrips.map((t, i) => [
      i + 1, t.vehicle, t.driver, t.from, t.to,
      t.distance, t.duration, t.avgSpeed, t.fuelUsed, t.date,
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `trip-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Export PDF ──────────────────────────────────────────────────────────────
  function exportPDF() {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Header
    pdf.setFillColor(15, 30, 50);
    pdf.rect(0, 0, 297, 25, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TelematicsHub — Trip Report', 14, 16);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 200, 16);

    // Summary
    pdf.setTextColor(40, 40, 40);
    pdf.setFontSize(10);
    pdf.text(`Total Trips: ${filteredTrips.length}`, 14, 33);
    if (selectedVehicle !== 'all') pdf.text(`Vehicle: ${selectedVehicle}`, 60, 33);
    if (dateFrom) pdf.text(`From: ${dateFrom}`, 120, 33);
    if (dateTo)   pdf.text(`To: ${dateTo}`, 170, 33);

    // Trip table
    autoTable(pdf, {
      startY: 38,
      head: [['#', 'Vehicle', 'Driver', 'From', 'To', 'Distance', 'Duration', 'Avg Speed', 'Fuel Used', 'Date']],
      body: filteredTrips.map((t, i) => [
        i + 1, t.vehicle, t.driver, t.from, t.to,
        t.distance, t.duration, t.avgSpeed, t.fuelUsed, t.date,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [42, 142, 158], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 248, 250] },
    });

    pdf.save(`trip-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  const hasDocuments = documents && documents.length > 0;

  return (
    <div className="animate-fade-in">

      {/* ── No Documents Alert ── */}
      {!hasDocuments && !dismissDocAlert && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(249,115,22,0.12)',
          border: '1px solid rgba(249,115,22,0.4)',
          borderRadius: 10, padding: '12px 18px', marginBottom: 20, gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.4rem' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: '#f97316', fontSize: '0.9rem' }}>
                No Documents Uploaded
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: 2 }}>
                Please upload your vehicle documents (Insurance, PUC, Fitness Certificate) to enable compliance tracking.
                <a href="/dashboard/upload-documents" style={{ marginLeft: 8, color: '#f97316', fontWeight: 600, textDecoration: 'none' }}>
                  Upload Now →
                </a>
              </div>
            </div>
          </div>
          <button
            onClick={() => setDismissDocAlert(true)}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1>Reports</h1>
          <p>Trip history, distance logs and fleet activity reports</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost btn-sm" onClick={exportCSV}>📥 Export CSV</button>
          <button className="btn btn-ghost btn-sm" onClick={exportPDF}>📄 Export PDF</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Total Trips',    value: filteredTrips.length,                                           icon: '🚗', color: '#2a8e9e' },
          { label: 'Total Distance', value: filteredTrips.reduce((s, t) => s + parseFloat(t.distance) || 0, 0).toFixed(0) + ' km', icon: '📍', color: '#27ae60' },
          { label: 'Fuel Consumed',  value: filteredTrips.reduce((s, t) => s + parseFloat(t.fuelUsed) || 0, 0).toFixed(1) + ' L',  icon: '⛽', color: '#f39c12' },
          { label: 'Vehicles',       value: isOwner ? vehicles.length : 1,                                  icon: '📊', color: '#3ab5c8' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: '1.6rem' }}>{s.icon}</div>
            <div className="stat-info">
              <h3 style={{ fontSize: '1.3rem', color: s.color }}>{s.value}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="reports-filters">
          {isOwner && (
            <div className="form-group" style={{ flex: 1 }}>
              <label>Vehicle</label>
              <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)}>
                <option value="all">All Vehicles</option>
                {vehicles.map(v => (
                  <option key={v._docId || v.id} value={v.reg || v.name}>
                    {v.reg || v.name} — {v.model}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group" style={{ flex: 1 }}>
            <label>From Date</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>To Date</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => {}}>Apply Filters</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); setSelectedVehicle('all'); }}>
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Trip table */}
      <div className="card">
        <div className="section-title">
          Trip Log
          <span style={{ fontSize: '0.78rem', fontWeight: 400, color: '#64748b', marginLeft: 8 }}>
            {filteredTrips.length} record{filteredTrips.length !== 1 ? 's' : ''}
          </span>
        </div>
        {filteredTrips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
            <div>No trips found for the selected filters.</div>
          </div>
        ) : (
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
                {filteredTrips.map((t, i) => (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--mid-gray)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--white)' }}>{t.vehicle}</td>
                    <td>{t.driver}</td>
                    <td>{t.from}</td>
                    <td>{t.to}</td>
                    <td style={{ color: 'var(--primary-light)' }}>{t.distance}</td>
                    <td>{t.duration}</td>
                    <td>{t.avgSpeed}</td>
                    <td>{t.fuelUsed}</td>
                    <td>{t.date}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => setViewTrip(t)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Driver summary */}
      <div className="card" style={{ marginTop: '20px' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--dark))', color: 'white', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {d.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      {d.name}
                    </div>
                  </td>
                  <td>{d.trips}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: 60, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${d.score}%`, background: d.score >= 90 ? '#27ae60' : d.score >= 80 ? '#2a8e9e' : d.score >= 70 ? '#f39c12' : '#e74c3c', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: d.score >= 90 ? '#27ae60' : d.score >= 80 ? '#3ab5c8' : d.score >= 70 ? '#f39c12' : '#e74c3c' }}>{d.score}</span>
                    </div>
                  </td>
                  <td><span className={`badge badge-${d.status === 'active' ? 'success' : d.status === 'on-leave' ? 'warning' : 'gray'}`}>{d.status}</span></td>
                  <td style={{ color: 'var(--mid-gray)' }}>{d.assignedVehicle}</td>
                  <td style={{ color: new Date(d.licenseExpiry) < new Date() ? '#e74c3c' : 'var(--text-light)' }}>{d.licenseExpiry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trip detail modal */}
      <TripDetailModal trip={viewTrip} onClose={() => setViewTrip(null)} />
    </div>
  );
}
