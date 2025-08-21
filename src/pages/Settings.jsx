export default function Settings(){
    (
  <div className="page active">
    <div className="page-header">
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">Configure your dashboard preferences</p>
    </div>
    <div className="settings-content">
      <div className="card"><div className="card__body">
        <h3>Account Settings</h3>
        <div className="form-group">
          <label className="form-label">Company Name</label>
          <input type="text" className="form-control" defaultValue="TelematicsHub Inc." />
        </div>
        <div className="form-group">
          <label className="form-label">Email Notifications</label>
          <select className="form-control">
            <option>All notifications</option>
            <option>Critical only</option>
            <option>Disabled</option>
          </select>
        </div>
        <button className="btn btn--primary">Save Settings</button>
      </div></div>
    </div>
  </div>
);
}