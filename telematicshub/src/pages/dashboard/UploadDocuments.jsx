import { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { uploadToCloudinary } from '../../utils/cloudinary';
import './UploadDocuments.css';

export default function UploadDocuments() {
  const { view } = useOutletContext();
  const isOwner = view === 'owner';
  const { currentUser } = useAuth();
  const { vehicles } = useData();
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({ vehicle: '', docType: '', issuer: '', issueDate: '', expiryDate: '' });
  const [uploaded, setUploaded] = useState([]);
  const [uploading,  setUploading]  = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [error,      setError]      = useState('');

  if (!isOwner) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1>Upload Documents</h1>
        </div>
        <div className="card" style={{textAlign:'center',padding:'60px'}}>
          <div style={{fontSize:'3rem',marginBottom:'16px'}}>🔒</div>
          <h3 style={{color:'var(--white)',marginBottom:'8px'}}>Owner Access Only</h3>
          <p style={{color:'var(--mid-gray)'}}>Only fleet owners can upload and manage documents.</p>
        </div>
      </div>
    );
  }

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...dropped]);
  };

  const handleFileChange = (e) => {
    const picked = Array.from(e.target.files);
    setFiles(prev => [...prev, ...picked]);
  };

  const removeFile = (idx) => setFiles(f => f.filter((_,i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicle || !form.docType) return;
    setUploading(true);
    setError('');

    try {
      const downloadURLs = [];

      // Upload each file to Cloudinary
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const folder = `telematicshub/documents/${form.vehicle}`;
        const { url } = await uploadToCloudinary(file, folder, (pct) => {
          setProgress(Math.round(((i / files.length) + pct / 100 / files.length) * 100));
        });
        downloadURLs.push({ name: file.name, url });
      }
      setProgress(100);

      // Save metadata to local backend
      const docData = {
        vehicle_id:    form.vehicle,
        document_type: form.docType,
        issuer:        form.issuer,
        issue_date:    form.issueDate,
        expiry_date:   form.expiryDate,
        file_url:      downloadURLs[0]?.url || '',
      };
      await api.post('/api/documents/', docData);

      const entry = {
        id: Date.now(),
        docType: form.docType,
        vehicle: form.vehicle,
        expiryDate: form.expiryDate,
        files: downloadURLs.length ? downloadURLs.map(f => f.name) : ['(no files)'],
        uploadedAt: new Date().toLocaleDateString(),
      };
      setUploaded(prev => [entry, ...prev]);
      setFiles([]);
      setProgress(0);
      setForm({ vehicle:'', docType:'', issuer:'', issueDate:'', expiryDate:'' });
    } catch (err) {
      setError('Upload failed: ' + err.message);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Upload Documents</h1>
        <p>Upload insurance, pollution certificates and other compliance documents</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:'24px',alignItems:'start'}}>
        {/* Upload form */}
        <form onSubmit={handleSubmit}>
          <div className="card" style={{marginBottom:'20px'}}>
            <div className="section-title">Document Details</div>
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                <div className="form-group">
                  <label>Vehicle *</label>
                  <select required value={form.vehicle} onChange={e=>setForm(f=>({...f,vehicle:e.target.value}))}>
                    <option value="">— Select Vehicle —</option>
                    {vehicles.map(v=><option key={v.id} value={v.id}>{v.reg} — {v.model}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Document Type *</label>
                  <select required value={form.docType} onChange={e=>setForm(f=>({...f,docType:e.target.value}))}>
                    <option value="">— Select Type —</option>
                    <option>Insurance</option>
                    <option>Pollution Certificate (PUC)</option>
                    <option>Registration Certificate (RC)</option>
                    <option>Fitness Certificate</option>
                    <option>Road Tax</option>
                    <option>Driver License</option>
                    <option>Permit</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Issued By / Insurer</label>
                <input type="text" placeholder="e.g. HDFC Ergo, RTO Maharashtra" value={form.issuer} onChange={e=>setForm(f=>({...f,issuer:e.target.value}))} />
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                <div className="form-group">
                  <label>Issue Date</label>
                  <input type="date" value={form.issueDate} onChange={e=>setForm(f=>({...f,issueDate:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input type="date" value={form.expiryDate} onChange={e=>setForm(f=>({...f,expiryDate:e.target.value}))} />
                </div>
              </div>

              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea placeholder="Any additional notes about this document..." />
              </div>
            </div>
          </div>

          {/* Drop zone */}
          <div className="card" style={{marginBottom:'20px'}}>
            <div className="section-title">Upload Files</div>
            <div
              className={`drop-zone ${dragging ? 'dragging' : ''}`}
              onDragOver={e=>{e.preventDefault();setDragging(true);}}
              onDragLeave={()=>setDragging(false)}
              onDrop={handleDrop}
              onClick={()=>fileRef.current?.click()}
            >
              <div style={{fontSize:'2.5rem',marginBottom:'12px'}}>📁</div>
              <div style={{fontSize:'0.95rem',fontWeight:600,color:'var(--white)',marginBottom:'6px'}}>
                Drop files here or click to browse
              </div>
              <div style={{fontSize:'0.8rem',color:'var(--mid-gray)'}}>
                Supports PDF, JPG, PNG, JPEG — Max 10MB per file
              </div>
              <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}} onChange={handleFileChange} />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div style={{marginTop:'14px',display:'flex',flexDirection:'column',gap:'8px'}}>
                {files.map((f, i) => (
                  <div key={i} className="file-item">
                    <span className="file-icon">{f.name.endsWith('.pdf') ? '📄' : '🖼️'}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'0.84rem',color:'var(--text-light)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
                      <div style={{fontSize:'0.72rem',color:'var(--mid-gray)'}}>{(f.size/1024).toFixed(1)} KB</div>
                    </div>
                    <button type="button" onClick={() => removeFile(i)} style={{background:'none',color:'var(--mid-gray)',fontSize:'1rem',cursor:'pointer',padding:'2px 6px'}} className="modal-close">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div style={{marginBottom:'12px',padding:'10px 14px',background:'rgba(231,76,60,0.1)',border:'1px solid rgba(231,76,60,0.3)',borderRadius:8,fontSize:'0.84rem',color:'#e74c3c'}}>
              {error}
            </div>
          )}

          {uploading && (
            <div style={{marginBottom:'12px'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.8rem',color:'var(--mid-gray)',marginBottom:4}}>
                <span>Uploading to Cloudinary...</span>
                <span>{progress}%</span>
              </div>
              <div style={{height:6,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${progress}%`,background:'var(--primary)',borderRadius:3,transition:'width 0.3s ease'}} />
              </div>
            </div>
          )}
          <div style={{display:'flex',gap:'10px'}}>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? `⏳ Uploading ${progress}%…` : '📤 Upload Document'}
            </button>
            <button type="reset" className="btn btn-ghost" disabled={uploading} onClick={()=>{setFiles([]);setForm({vehicle:'',docType:'',issuer:'',issueDate:'',expiryDate:''});setError('');}}>
              Clear
            </button>
          </div>
        </form>

        {/* Upload history */}
        <div className="card">
          <div className="section-title">Recently Uploaded</div>
          {uploaded.length === 0 ? (
            <div style={{textAlign:'center',padding:'30px 20px'}}>
              <div style={{fontSize:'2rem',marginBottom:'10px'}}>📭</div>
              <p style={{fontSize:'0.84rem',color:'var(--mid-gray)'}}>No uploads yet in this session</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {uploaded.map(u => (
                <div key={u.id} style={{background:'rgba(39,174,96,0.06)',border:'1px solid rgba(39,174,96,0.15)',borderRadius:10,padding:'12px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                    <span style={{fontSize:'0.86rem',fontWeight:600,color:'var(--white)'}}>{u.docType}</span>
                    <span className="badge badge-success">Uploaded</span>
                  </div>
                  <div style={{fontSize:'0.78rem',color:'var(--mid-gray)'}}>
                    <div>Vehicle: {u.vehicle}</div>
                    {u.expiryDate && <div>Expires: {u.expiryDate}</div>}
                    <div>Files: {u.files.join(', ')}</div>
                    <div style={{marginTop:'3px',color:'#27ae60'}}>✓ {u.uploadedAt}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tips */}
          <div style={{marginTop:'20px',paddingTop:'16px',borderTop:'1px solid rgba(42,142,158,0.1)'}}>
            <div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--mid-gray)',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Tips</div>
            {[
              'Upload insurance 30 days before expiry',
              'PUC certificates are valid for 6 months',
              'Keep digital copies of all documents',
              'Set expiry reminders after uploading',
            ].map((tip, i) => (
              <div key={i} style={{fontSize:'0.8rem',color:'var(--mid-gray)',padding:'6px 0',borderBottom:'1px solid rgba(42,142,158,0.06)',display:'flex',gap:'8px'}}>
                <span style={{color:'var(--primary-light)'}}>→</span> {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
