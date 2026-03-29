import { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { uploadToCloudinary } from '../../utils/cloudinary';

export default function Settings() {
  const { view } = useOutletContext();
  const isOwner = view === 'owner';
  const [activeTab, setActiveTab] = useState('profile');
  const { userProfile, updateProfile } = useAuth();

  const initials = userProfile?.name
    ? userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';
  const displayName = userProfile?.name || '';
  const displayEmail = userProfile?.email || '';
  const displayPhone = userProfile?.phone || '';
  const displayRole = userProfile?.role === 'owner' ? 'Fleet Owner' : userProfile?.role === 'driver' ? 'Driver' : '';

  const [profileForm, setProfileForm] = useState({
    name:  displayName,
    phone: displayPhone,
  });
  const [saveStatus,   setSaveStatus]   = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview,   setPhotoPreview]   = useState(userProfile?.photoURL || null);
  const photoInputRef = useRef(null);

  const [photoError, setPhotoError] = useState('');

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoUploading(true);
    setPhotoError('');
    try {
      const { url } = await uploadToCloudinary(file, 'telematicshub/profiles');
      setPhotoPreview(url);
      await updateProfile({ photoURL: url });
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleProfileSave = async () => {
    setSaveStatus('saving');
    try {
      await updateProfile({ name: profileForm.name, phone: profileForm.phone });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 2500);
    }
  };

  const tabs = [
    { key: 'profile',  label: 'Profile' },
    { key: 'notifications', label: 'Notifications' },
    ...(isOwner ? [{ key: 'fleet', label: 'Fleet Settings' }] : []),
    { key: 'security', label: 'Security' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account, preferences and fleet configuration</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:'24px',alignItems:'start'}}>
        {/* Sidebar tabs */}
        <div className="card" style={{padding:'10px'}}>
          {tabs.map(t => (
            <button
              key={t.key}
              className={`sidebar-item ${activeTab===t.key?'active':''}`}
              style={{width:'100%',marginBottom:'2px'}}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeTab === 'profile' && (
            <div className="card">
              <div className="section-title">Profile Information</div>
              <div style={{display:'flex',alignItems:'center',gap:'20px',marginBottom:'28px'}}>
                <div style={{position:'relative',width:70,height:70,flexShrink:0}}>
                  <div style={{width:70,height:70,borderRadius:'50%',background:'linear-gradient(135deg,var(--primary),var(--dark))',color:'white',fontSize:'1.5rem',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',border:'3px solid rgba(42,142,158,0.3)',overflow:'hidden'}}>
                    {photoPreview
                      ? <img src={photoPreview} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                      : initials}
                  </div>
                  {photoUploading && (
                    <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',color:'white'}}>...</div>
                  )}
                </div>
                <div>
                  <div style={{fontWeight:700,color:'var(--white)',fontSize:'1.1rem'}}>{profileForm.name || displayName}</div>
                  <div style={{color:'var(--primary-light)',fontSize:'0.82rem'}}>{displayRole}</div>
                  <input ref={photoInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePhotoChange} />
                  <button className="btn btn-ghost btn-xs" style={{marginTop:'8px'}} onClick={() => photoInputRef.current?.click()} disabled={photoUploading}>
                    {photoUploading ? 'Uploading...' : 'Change Photo'}
                  </button>
                  {photoError && <div style={{fontSize:'0.72rem',color:'#e74c3c',marginTop:4,maxWidth:200}}>{photoError}</div>}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={profileForm.name}
                    onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group"><label>Email</label><input type="email" value={displayEmail} disabled style={{opacity:0.5}} /></div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" value={profileForm.phone}
                    onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="form-group"><label>Role</label><input type="text" value={displayRole} disabled style={{opacity:0.5}} /></div>
              </div>
              <div style={{display:'flex',gap:'10px',alignItems:'center',marginTop:'20px',paddingTop:'16px',borderTop:'1px solid rgba(42,142,158,0.1)'}}>
                <button className="btn btn-primary btn-sm" onClick={handleProfileSave} disabled={saveStatus==='saving'}>
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setProfileForm({ name: displayName, phone: displayPhone })}>Cancel</button>
                {saveStatus === 'saved' && <span style={{color:'#27ae60',fontSize:'0.82rem'}}>✓ Profile updated</span>}
                {saveStatus === 'error' && <span style={{color:'#e74c3c',fontSize:'0.82rem'}}>Failed — check Firestore rules</span>}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <div className="section-title">Notification Preferences</div>
              <div style={{display:'flex',flexDirection:'column',gap:'0'}}>
                {[
                  { label: 'Fuel level alerts',          desc: 'Notify when fuel drops below 25%',         default: true },
                  { label: 'Insurance expiry reminders', desc: 'Remind 30, 7 and 1 day(s) before expiry', default: true },
                  { label: 'Pollution cert. reminders',  desc: 'Remind before PUC expiry',                 default: true },
                  { label: 'Engine temperature alerts',  desc: 'Notify when temp exceeds safe range',      default: true },
                  { label: 'Vehicle offline alerts',     desc: 'Notify when vehicle goes offline',         default: false },
                  { label: 'Trip completion reports',    desc: 'Send report after each trip ends',         default: false },
                  { label: 'Weekly summary emails',      desc: 'Receive weekly fleet performance digest',  default: true },
                ].map((n, i) => (
                  <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom:'1px solid rgba(42,142,158,0.08)'}}>
                    <div>
                      <div style={{fontSize:'0.9rem',fontWeight:500,color:'var(--text-light)'}}>{n.label}</div>
                      <div style={{fontSize:'0.78rem',color:'var(--mid-gray)',marginTop:'2px'}}>{n.desc}</div>
                    </div>
                    <ToggleSwitch defaultOn={n.default} />
                  </div>
                ))}
              </div>
              <div style={{marginTop:'20px'}}>
                <button className="btn btn-primary btn-sm">Save Preferences</button>
              </div>
            </div>
          )}

          {activeTab === 'fleet' && isOwner && (
            <div className="card">
              <div className="section-title">Fleet Configuration</div>
              <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                  <div className="form-group"><label>Fuel Alert Threshold (%)</label><input type="number" defaultValue="25" min="5" max="50" /></div>
                  <div className="form-group"><label>Max Engine Temp (°C)</label><input type="number" defaultValue="90" min="80" max="110" /></div>
                  <div className="form-group"><label>Speed Limit (km/h)</label><input type="number" defaultValue="80" min="40" max="120" /></div>
                </div>
                <div className="form-group">
                  <label>Document Expiry Reminder (days before)</label>
                  <select defaultValue="30">
                    <option>7</option><option>14</option><option>30</option><option>60</option>
                  </select>
                </div>
                <div style={{display:'flex',gap:'10px',paddingTop:'8px',borderTop:'1px solid rgba(42,142,158,0.1)'}}>
                  <button className="btn btn-primary btn-sm">Save Fleet Settings</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <div className="section-title">Change Password</div>
              <div style={{display:'flex',flexDirection:'column',gap:'14px',maxWidth:'400px'}}>
                <div className="form-group"><label>Current Password</label><input type="password" placeholder="••••••••" /></div>
                <div className="form-group"><label>New Password</label><input type="password" placeholder="Min. 8 characters" /></div>
                <div className="form-group"><label>Confirm New Password</label><input type="password" placeholder="Repeat new password" /></div>
                <button className="btn btn-primary btn-sm" style={{alignSelf:'flex-start'}}>Update Password</button>
              </div>

              <div className="divider" />

              <div className="section-title">Security Options</div>
              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                {[
                  { label: 'Two-Factor Authentication', desc: 'Add an extra layer of security to your account' },
                  { label: 'Login Notifications',       desc: 'Get notified when a new device logs in' },
                ].map((s, i) => (
                  <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px',background:'rgba(255,255,255,0.03)',borderRadius:10,border:'1px solid rgba(42,142,158,0.1)'}}>
                    <div>
                      <div style={{fontSize:'0.9rem',fontWeight:500,color:'var(--text-light)'}}>{s.label}</div>
                      <div style={{fontSize:'0.78rem',color:'var(--mid-gray)',marginTop:'2px'}}>{s.desc}</div>
                    </div>
                    <ToggleSwitch defaultOn={false} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ defaultOn }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: on ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
        border: 'none', cursor: 'pointer',
        position: 'relative', transition: 'background 0.25s', flexShrink: 0,
      }}
    >
      <div style={{
        position:'absolute', top: 2, left: on ? 22 : 2, width: 20, height: 20,
        borderRadius: '50%', background: 'white',
        transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}
