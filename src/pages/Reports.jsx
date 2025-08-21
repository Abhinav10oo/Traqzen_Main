export default function Reports(){
return (
  <div className="page active">
    <div className="page-header">
      <h1 className="page-title">Fleet Reports</h1>
      <p className="page-subtitle">Generate and download comprehensive fleet reports</p>
    </div>
    <div className="reports-content">
      <div className="card"><div className="card__body">
        <h3>Report Generation</h3>
        <div className="form-group">
          <label className="form-label">Report Type</label>
          <select className="form-control">
            <option>Vehicle Performance</option>
            <option>Maintenance Summary</option>
            <option>Fuel Consumption</option>
            <option>Driver Performance</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date Range</label>
          <input type="date" className="form-control" />
        </div>
        <button className="btn btn--primary">Generate Report</button>
      </div></div>
    </div>
  </div>
);
}