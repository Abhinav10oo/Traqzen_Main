import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { seedFirestore } from '../utils/seedFirestore';
import './AuthPages.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard/overview');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setLoading(true);
    try {
      await seedFirestore();
      await login('owner@demo.com', 'demo1234');
      navigate('/dashboard/overview');
    } catch (err) {
      setError(`Demo failed: ${err.code || err.message}`);
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
            <span className="auth-live-text">FLEET ONLINE</span>
            <span className="auth-live-sep">|</span>
            <span className="auth-live-sub">6 vehicles tracked</span>
          </div>

          {/* Dial */}
          <div className="auth-visual-center">
            <div className="auth-visual-ring">
              <div className="auth-visual-inner">
                <span className="auth-visual-num">4/6</span>
                <span className="auth-visual-unit">Active Vehicles</span>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="auth-visual-bottom">
            <h2 className="auth-visual-tagline">
              Your Fleet,<br />
              <span>Always in View</span>
            </h2>
            <p className="auth-visual-desc">
              Real-time GPS, engine health, fuel levels and document status — unified in one command dashboard.
            </p>
            <div className="auth-features">
              {[
                'Live GPS tracking across all vehicles',
                'Instant alerts for engine faults & fuel',
                'Automated document expiry reminders',
                'Trip history and fleet analytics',
              ].map((f, i) => (
                <div key={i} className="auth-feature-item">
                  <div className="auth-check">✓</div>
                  <span>{f}</span>
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
            <h1>Welcome back</h1>
            <p className="auth-tagline">Sign in to your fleet dashboard</p>

            {error && <div className="auth-error">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
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

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>

              <div className="auth-options">
                <label className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a className="auth-link">Forgot password?</a>
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <span className="spinner" /> : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                )}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="auth-switch">
              Don't have an account? <Link to="/signup" className="auth-link">Create one</Link>
            </p>

            <div className="demo-access">
              <div className="demo-divider"><span>or try demo</span></div>
              <button className="demo-btn" onClick={handleDemo} disabled={loading}>
                {loading ? <span className="spinner-dark" /> : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
                  </svg>
                )}
                View Live Demo Dashboard
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}