import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadToCloudinary } from '../../utils/cloudinary';
import './ProfileVerification.css';

const ID_DOC_TYPES = [
  { key: 'govt_id',       label: 'Government ID',  hint: 'Aadhaar card, Passport or Driving Licence' },
  { key: 'address_proof', label: 'Address Proof',  hint: 'Utility bill or Bank statement' },
];

function calcProgress(profile, verificationDocs) {
  let done = 0;
  const total = 5; // firstName, lastName, phone, govt_id, address_proof
  if (profile?.firstName)  done++;
  if (profile?.lastName)   done++;
  if (profile?.phone)      done++;
  if (verificationDocs?.govt_id)       done++;
  if (verificationDocs?.address_proof) done++;
  return Math.round((done / total) * 100);
}

function overallStatus(profile, verificationDocs) {
  const missing = [];
  if (!profile?.firstName)  missing.push('First name');
  if (!profile?.lastName)   missing.push('Last name');
  if (!profile?.phone)      missing.push('Phone number');
  if (!verificationDocs?.govt_id)       missing.push('Government ID');
  if (!verificationDocs?.address_proof) missing.push('Address Proof');
  if (missing.length === 0) return { type: 'complete', missing };
  return { type: 'incomplete', missing };
}

export default function ProfileVerification() {
  const { currentUser, userProfile, updateProfile } = useAuth();

  // --- Local form state pre-filled from Firestore profile ---
  const [form, setForm] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    phone:     '',
  });
  const [formSaving, setFormSaving] = useState(false);
  const [formMsg,    setFormMsg]    = useState('');

  // --- Photo state ---
  const photoRef = useRef(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMsg,       setPhotoMsg]       = useState('');

  // --- Verification docs state ---
  const [verificationDocs, setVerificationDocs] = useState({});
  const [docUploading, setDocUploading] = useState({});
  const [docMsg,       setDocMsg]       = useState({});
  const docRefs = { govt_id: useRef(null), address_proof: useRef(null) };

  // Populate form + docs from userProfile
  useEffect(() => {
    if (userProfile) {
      setForm({
        firstName: userProfile.firstName || '',
        lastName:  userProfile.lastName  || '',
        email:     userProfile.email     || '',
        phone:     userProfile.phone     || '',
      });
      setVerificationDocs(userProfile.verificationDocs || {});
    }
  }, [userProfile]);

  const progress = calcProgress(
    { firstName: form.firstName, lastName: form.lastName, phone: form.phone },
    verificationDocs
  );
  const status = overallStatus(
    { firstName: form.firstName, lastName: form.lastName, phone: form.phone },
    verificationDocs
  );

  const initials = userProfile?.name
    ? userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // ── Section 1: Save personal info ──────────────────────────────────────────
  async function handleSaveInfo(e) {
    e.preventDefault();
    setFormSaving(true);
    setFormMsg('');
    try {
      const combinedName = `${form.firstName} ${form.lastName}`.trim();
      await updateProfile({
        firstName: form.firstName,
        lastName:  form.lastName,
        name:      combinedName,
        phone:     form.phone,
      });
      setFormMsg('saved');
    } catch (err) {
      setFormMsg('error');
    } finally {
      setFormSaving(false);
    }
  }

  // ── Section 2: Upload profile photo ────────────────────────────────────────
  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    setPhotoUploading(true);
    setPhotoMsg('');
    try {
      const { url } = await uploadToCloudinary(file, 'telematicshub/profiles');
      await updateProfile({ photoURL: url });
      setPhotoMsg('saved');
    } catch {
      setPhotoMsg('error');
    } finally {
      setPhotoUploading(false);
    }
  }

  // ── Section 3: Upload verification document ─────────────────────────────────
  async function handleDocUpload(docKey, e) {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    setDocUploading(prev => ({ ...prev, [docKey]: true }));
    setDocMsg(prev => ({ ...prev, [docKey]: '' }));
    try {
      const { url } = await uploadToCloudinary(file, `telematicshub/verification/${currentUser.uid}`);

      const docEntry = {
        url,
        fileName:    file.name,
        uploadedAt:  new Date().toISOString(),
        status:      'pending_review',
      };

      const updatedDocs = { ...verificationDocs, [docKey]: docEntry };
      await updateProfile({ [`verificationDocs.${docKey}`]: docEntry });
      setVerificationDocs(updatedDocs);
      setDocMsg(prev => ({ ...prev, [docKey]: 'saved' }));
    } catch (err) {
      setDocMsg(prev => ({ ...prev, [docKey]: 'error' }));
    } finally {
      setDocUploading(prev => ({ ...prev, [docKey]: false }));
    }
  }

  return (
    <div className="animate-fade-in pv-page">
      <div className="page-header">
        <h1>Profile Verification</h1>
        <p>Complete your profile and submit identity documents to unlock all features</p>
      </div>

      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      <div className="pv-card pv-progress-card">
        <div className="pv-progress-header">
          <span className="pv-progress-label">Profile Completion</span>
          <span className="pv-progress-pct">{progress}%</span>
        </div>
        <div className="pv-progress-track">
          <div className="pv-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* ── Status banner ─────────────────────────────────────────────────── */}
      {status.type === 'complete' ? (
        <div className="pv-banner pv-banner-success">
          <span>✅</span>
          <div>
            <strong>Verification Complete</strong>
            <p>Your profile and documents are fully submitted.</p>
          </div>
        </div>
      ) : (
        <div className="pv-banner pv-banner-warning">
          <span>⚠️</span>
          <div>
            <strong>Action Required</strong>
            <p>Still missing: {status.missing.join(', ')}</p>
          </div>
        </div>
      )}

      {/* ── Section 1: Personal Information ───────────────────────────────── */}
      <div className="pv-card">
        <div className="pv-section-title">
          <span className="pv-section-icon">👤</span>
          Personal Information
        </div>
        <form onSubmit={handleSaveInfo}>
          <div className="pv-grid-2">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                placeholder="Arjun"
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                placeholder="Sharma"
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={form.email}
                disabled
                style={{ opacity: 0.55 }}
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                required
              />
            </div>
          </div>
          <div className="pv-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={formSaving}>
              {formSaving ? 'Saving…' : 'Save Changes'}
            </button>
            {formMsg === 'saved' && <span className="pv-ok">✓ Saved</span>}
            {formMsg === 'error' && <span className="pv-err">Failed to save</span>}
          </div>
        </form>
      </div>

      {/* ── Section 2: Profile Photo ───────────────────────────────────────── */}
      <div className="pv-card">
        <div className="pv-section-title">
          <span className="pv-section-icon">📷</span>
          Profile Photo
        </div>
        <div className="pv-photo-row">
          <div className="pv-avatar-wrap">
            {userProfile?.photoURL
              ? <img src={userProfile.photoURL} alt="Profile" className="pv-avatar-img" />
              : <div className="pv-avatar-placeholder">{initials}</div>}
          </div>
          <div className="pv-photo-info">
            <p style={{ fontSize: '0.85rem', color: 'var(--mid-gray)', marginBottom: 12 }}>
              Upload a clear photo. It will appear in the navbar and sidebar.
            </p>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => photoRef.current?.click()}
              disabled={photoUploading}
            >
              {photoUploading ? 'Uploading…' : '📁 Choose Photo'}
            </button>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
            />
            {photoMsg === 'saved' && <span className="pv-ok" style={{ marginLeft: 12 }}>✓ Updated</span>}
            {photoMsg === 'error' && <span className="pv-err" style={{ marginLeft: 12 }}>Failed to upload</span>}
          </div>
        </div>
      </div>

      {/* ── Section 3: Identity Verification Documents ────────────────────── */}
      <div className="pv-card">
        <div className="pv-section-title">
          <span className="pv-section-icon">🪪</span>
          Identity Verification Documents
        </div>
        <p style={{ fontSize: '0.83rem', color: 'var(--mid-gray)', marginBottom: 20 }}>
          Upload clear, readable copies. All documents are stored securely.
        </p>
        <div className="pv-doc-list">
          {ID_DOC_TYPES.map(({ key, label, hint }) => {
            const uploaded = verificationDocs[key];
            const isUploading = docUploading[key];
            const msg = docMsg[key];
            return (
              <div key={key} className="pv-doc-item">
                <div className="pv-doc-info">
                  <div className="pv-doc-label">{label}</div>
                  <div className="pv-doc-hint">{hint}</div>
                  {uploaded && (
                    <div className="pv-doc-uploaded">
                      ✓ Uploaded on {new Date(uploaded.uploadedAt).toLocaleDateString()} — {uploaded.fileName}
                    </div>
                  )}
                </div>
                <div className="pv-doc-right">
                  {uploaded
                    ? <span className="badge badge-success">Submitted</span>
                    : <span className="badge badge-pending">Pending</span>}
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: 8 }}
                    onClick={() => docRefs[key].current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading…' : uploaded ? 'Replace' : '📎 Upload'}
                  </button>
                  <input
                    ref={docRefs[key]}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={e => handleDocUpload(key, e)}
                  />
                  {msg === 'saved' && <div className="pv-ok">✓ Done</div>}
                  {msg === 'error' && <div className="pv-err">Failed</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 4: Verification Status ────────────────────────────────── */}
      <div className="pv-card">
        <div className="pv-section-title">
          <span className="pv-section-icon">🔍</span>
          Verification Status
        </div>
        <div className="pv-status-list">
          {[
            { label: 'First Name',       done: !!form.firstName },
            { label: 'Last Name',        done: !!form.lastName  },
            { label: 'Phone Number',     done: !!form.phone     },
            { label: 'Government ID',    done: !!verificationDocs.govt_id },
            { label: 'Address Proof',    done: !!verificationDocs.address_proof },
          ].map(({ label, done }) => (
            <div key={label} className="pv-status-row">
              <span className={`pv-status-dot ${done ? 'done' : 'pending'}`} />
              <span className="pv-status-label">{label}</span>
              <span className={`pv-status-badge ${done ? 'done' : ''}`}>
                {done ? 'Complete' : 'Incomplete'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
