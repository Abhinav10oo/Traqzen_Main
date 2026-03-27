import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthPages.css';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirm: '', role: 'owner',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await signup(form.firstName, form.lastName, form.email, form.phone, form.password, form.role);
      navigate('/dashboard/overview');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('An account with this email already exists.');
      else if (err.code === 'auth/weak-password') setError('Password must be at least 6 characters.');
      else setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </Link>

      {/* Card */}
      <div className="auth-container">

        {/* ── LEFT: DARK VISUAL PANEL ── */}
        <div className="auth-info">
          <div className="auth-visual-grid" />
          <div className="auth-visual-vignette" />

          <div className="auth-crosshair auth-crosshair--tl" />
          <div className="auth-crosshair auth-crosshair--tr" />
          <div className="auth-crosshair auth-crosshair--bl" />
          <div className="auth-crosshair auth-crosshair--br" />

          {/* Live chip */}
          <div className="auth-live-chip">
            <span className="auth-live-dot" />
            <span className="auth-live-text">SYSTEM READY</span>
            <span className="auth-live-sep">|</span>
            <span className="auth-live-sub">Connect your fleet</span>
          </div>

          {/* Dial */}
          <div className="auth-visual-center">
            <div className="auth-visual-ring">
              <div className="auth-visual-inner">
                <span className="auth-visual-num">04</span>
                <span className="auth-visual-unit">Steps to Go Live</span>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="auth-visual-bottom">
            <h2 className="auth-visual-tagline">
              Fleet Management,<br />
              <span>Simplified</span>
            </h2>
            <p className="auth-visual-desc">
              Register once, connect your IoT sensors and your entire fleet is live in minutes.
            </p>
            <div className="auth-steps">
              {[
                { n: '01', t: 'Create your account', d: 'Register as owner or driver' },
                { n: '02', t: 'Add your vehicles', d: 'Enter vehicle details and docs' },
                { n: '03', t: 'Connect IoT sensors', d: 'Link ESP32/Arduino hardware' },
                { n: '04', t: 'Start monitoring', d: 'Live telemetry on dashboard' },
              ].map((s, i) => (
                <div key={i} className="auth-step">
                  <div className="auth-step-num">{s.n}</div>
                  <div>
                    <div className="auth-step-title">{s.t}</div>
                    <div className="auth-step-desc">{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: FORM PANEL ── */}
        <div className="auth-form-panel">
          <Link to="/" className="auth-form-logo">
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="#334155"/>
              <path d="M5 18L9 10L13 15L17 8L23 18" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="14" cy="22" r="2" fill="#22C55E"/>
            </svg>
            <span>TelematicsHub</span>
          </Link>

          <div className="auth-form-wrap">
            <h1>Create account</h1>
            <p className="auth-tagline">Get your fleet online — free</p>

            {error && <div className="auth-error">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              {/* Role */}
              <div className="role-selector">
                {['owner', 'driver'].map(role => (
                  <button
                    type="button"
                    key={role}
                    className={`role-btn${form.role === role ? ' active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, role }))}
                  >
                    {role === 'owner' ? '🏢 Owner / Admin' : '🚛 Driver'}
                  </button>
                ))}
              </div>

              {/* Name */}
              <div className="auth-form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    placeholder="Arjun"
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    placeholder="Sharma"
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>

              {/* Passwords */}
              <div className="auth-form-row">
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Min. 8 chars"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    minLength={8}
                  />
                </div>
                <div className="form-group">
                  <label>Confirm</label>
                  <input
                    type="password"
                    placeholder="Repeat"
                    value={form.confirm}
                    onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <label className="checkbox-wrap" style={{ marginTop: '2px' }}>
                <input type="checkbox" required />
                <span>I agree to the <a className="auth-link">Terms</a> and <a className="auth-link">Privacy Policy</a></span>
              </label>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <span className="spinner" /> : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <line x1="19" y1="8" x2="19" y2="14"/>
                    <line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                )}
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}