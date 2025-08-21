import React from 'react';
import '../styles/KpiCard.css';


export default function KpiCard({ icon, bg, value, label }) {
  const Icon = icon;
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: bg }}>
        <Icon className="kpi-icon-svg" />
      </div>
      <div className="kpi-content">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  );
}
