import { Link } from 'react-router-dom';
import LandingNavbar from '../components/LandingNavbar';
import './Landing.css';

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
    tag: 'LIVE',
    title: 'Real-Time GPS Tracking',
    desc: 'Sub-second GPS position updates for every vehicle. View live map, speed, heading and status across your entire fleet from one command view.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
    tag: 'SMART',
    title: 'Sensor Data Fusion',
    desc: 'Consolidates fuel level, engine temperature, battery voltage and door state into unified telemetry streams over MQTT.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    tag: 'ALERT',
    title: 'Intelligent Alert Engine',
    desc: 'Rule-based alert system triggers instant notifications for engine faults, low fuel, geofence breaches and overdue maintenance.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    tag: 'DOCS',
    title: 'Document Vault',
    desc: 'Store and track insurance, RC, PUC and fitness certificates per vehicle. Automated expiry alerts before documents lapse.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    tag: 'ANALYTICS',
    title: 'Fleet Analytics',
    desc: 'Trip history, fuel consumption trends, driver scoring and utilisation reports — all exportable for operations reviews.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
    tag: 'MAINT',
    title: 'Maintenance Scheduler',
    desc: 'Log service history, schedule upcoming maintenance by mileage or date, and track repair costs across the entire fleet.',
  },
];

const steps = [
  { num: '01', title: 'Sensor Layer', desc: 'ESP32/Arduino hardware with GPS, fuel, temperature and voltage modules installed on vehicle.' },
  { num: '02', title: 'MQTT Transmission', desc: 'Telemetry packets published to broker every 5 seconds. Works on 2G/4G cellular networks.' },
  { num: '03', title: 'Cloud Processing', desc: 'Python backend subscribes, validates data, triggers alerts and persists to Firestore.' },
  { num: '04', title: 'Dashboard View', desc: 'React frontend renders live status, charts and alerts accessible from any device.' },
];

export default function Landing() {
  return (
    <div className="lp-root">
      <LandingNavbar />

      {/* ── HERO ── */}
      <section className="lp-hero">
        {/* Industrial grid */}
        <div className="lp-hero-grid" aria-hidden="true" />

        {/* Crosshair accent */}
        <div className="lp-crosshair lp-crosshair--tl" aria-hidden="true" />
        <div className="lp-crosshair lp-crosshair--br" aria-hidden="true" />

        <div className="lp-hero-inner">
          <div className="lp-hero-content">
            {/* Status pill */}
            <div className="lp-status-pill">
              <span className="lp-status-dot" />
              <span className="lp-status-mono">SYSTEM ONLINE</span>
              <span className="lp-status-sep">|</span>
              <span className="lp-status-light">6 vehicles tracked</span>
            </div>

            <h1 className="lp-hero-h1">
              Real-Time Vehicle<br />
              <span className="lp-hero-accent">Intelligence</span><br />
              for Fleet Operators
            </h1>

            <p className="lp-hero-sub">
              TelematicsHub connects IoT sensors on your vehicles to a unified command dashboard —
              giving you live GPS, engine health, fuel levels and document status in one place.
            </p>

            <div className="lp-hero-ctas">
              <Link to="/signup" className="lp-btn lp-btn-primary">
                Get Started Free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <Link to="/dashboard/overview" className="lp-btn lp-btn-ghost">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                View Live Demo
              </Link>
            </div>

            {/* Metrics row */}
            <div className="lp-hero-metrics">
              {[
                { val: '6+', lbl: 'Vehicles' },
                { val: '99.8%', lbl: 'Uptime' },
                { val: '<5s', lbl: 'Latency' },
                { val: '24/7', lbl: 'Monitoring' },
              ].map((m) => (
                <div key={m.lbl} className="lp-metric">
                  <span className="lp-metric-val">{m.val}</span>
                  <span className="lp-metric-lbl">{m.lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard mockup panel */}
          <div className="lp-hero-panel">
            {/* Panel header bar */}
            <div className="lp-panel-header">
              <div className="lp-panel-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                TelematicsHub — Fleet Overview
              </div>
              <div className="lp-panel-live">
                <span className="lp-panel-live-dot" />LIVE
              </div>
            </div>

            {/* KPI row */}
            <div className="lp-panel-kpis">
              {[
                { icon: '🚛', val: '6', lbl: 'Total', color: '#334155' },
                { icon: '✓', val: '4', lbl: 'Active', color: '#22C55E' },
                { icon: '⚠', val: '2', lbl: 'Warning', color: '#F97316' },
                { icon: '✕', val: '1', lbl: 'Alert', color: '#EF4444' },
              ].map((k) => (
                <div key={k.lbl} className="lp-kpi">
                  <span className="lp-kpi-icon" style={{ color: k.color }}>{k.icon}</span>
                  <span className="lp-kpi-val" style={{ color: k.color }}>{k.val}</span>
                  <span className="lp-kpi-lbl">{k.lbl}</span>
                </div>
              ))}
            </div>

            {/* Vehicle list */}
            <div className="lp-panel-section-label">VEHICLE STATUS</div>
            <div className="lp-vehicle-list">
              {[
                { id: 'MH 12 AB 1234', driver: 'Ramesh S.', status: 'active', speed: '62', fuel: 88 },
                { id: 'GJ 01 GH 3456', driver: 'Suresh P.', status: 'warning', speed: '0', fuel: 22 },
                { id: 'DL 5S CD 5678', driver: 'Vijay K.', status: 'alert', speed: '44', fuel: 55 },
              ].map((v) => (
                <div key={v.id} className="lp-vehicle-row">
                  <div className={`lp-vehicle-status lp-vs--${v.status}`} />
                  <div className="lp-vehicle-info">
                    <span className="lp-vehicle-id">{v.id}</span>
                    <span className="lp-vehicle-driver">{v.driver}</span>
                  </div>
                  <div className="lp-vehicle-speed">
                    <span className="lp-mono">{v.speed}</span>
                    <span className="lp-unit">km/h</span>
                  </div>
                  <div className="lp-fuel-bar-wrap">
                    <div className="lp-fuel-bar" style={{ width: `${v.fuel}%`, background: v.fuel < 30 ? '#F97316' : '#22C55E' }} />
                    <span className="lp-fuel-pct lp-mono">{v.fuel}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Alert feed */}
            <div className="lp-panel-section-label" style={{ marginTop: '12px' }}>ACTIVE ALERTS</div>
            <div className="lp-alert-feed">
              <div className="lp-alert lp-alert--crit">
                <span className="lp-alert-badge lp-alert-badge--crit">CRIT</span>
                Engine overheating — GJ 01 GH 3456
                <span className="lp-alert-time lp-mono">02:14</span>
              </div>
              <div className="lp-alert lp-alert--warn">
                <span className="lp-alert-badge lp-alert-badge--warn">WARN</span>
                Insurance expiring in 3 days — DL 5S CD 5678
                <span className="lp-alert-time lp-mono">14:02</span>
              </div>
              <div className="lp-alert lp-alert--warn">
                <span className="lp-alert-badge lp-alert-badge--warn">WARN</span>
                Fuel below 25% — GJ 01 GH 3456
                <span className="lp-alert-time lp-mono">13:47</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="lp-trust-bar">
        <div className="lp-trust-inner">
          <span className="lp-trust-label">BUILT ON</span>
          {['Firebase', 'MQTT / IoT', 'React', 'Python', 'ESP32 / Arduino'].map((t) => (
            <span key={t} className="lp-trust-item">{t}</span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="lp-features">
        <div className="lp-container">
          <div className="lp-section-head">
            <p className="lp-eyebrow">CAPABILITIES</p>
            <h2 className="lp-section-h2">Everything Your Fleet Needs</h2>
            <p className="lp-section-sub">One platform covering tracking, diagnostics, documents and analytics — built for small Indian fleet operators.</p>
          </div>
          <div className="lp-features-grid">
            {features.map((f, i) => (
              <div key={i} className="lp-feature-card" style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="lp-feature-top">
                  <div className="lp-feature-icon-wrap">{f.icon}</div>
                  <span className="lp-feature-tag">{f.tag}</span>
                </div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-how">
        <div className="lp-container">
          <div className="lp-section-head">
            <p className="lp-eyebrow">ARCHITECTURE</p>
            <h2 className="lp-section-h2">From Sensor to Dashboard</h2>
            <p className="lp-section-sub">A clean four-layer pipeline transforms raw hardware signals into actionable fleet intelligence.</p>
          </div>
          <div className="lp-steps">
            {steps.map((s, i) => (
              <div key={i} className="lp-step">
                <div className="lp-step-num lp-mono">{s.num}</div>
                {i < steps.length - 1 && <div className="lp-step-connector" aria-hidden="true" />}
                <div className="lp-step-icon-ring">
                  {i === 0 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}
                  {i === 1 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.92 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.83 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.92z"/></svg>}
                  {i === 2 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                  {i === 3 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
                </div>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TELEMATICS DATA PREVIEW ── */}
      <section className="lp-data-section">
        <div className="lp-container">
          <div className="lp-data-grid">
            <div className="lp-data-content">
              <p className="lp-eyebrow">TELEMETRY</p>
              <h2 className="lp-section-h2" style={{ textAlign: 'left', maxWidth: '400px' }}>Live Sensor Data, Instantly</h2>
              <p className="lp-section-sub" style={{ textAlign: 'left', margin: '0' }}>
                Hardware sensors transmit readings every few seconds. TelematicsHub ingests, stores and visualises this data with zero configuration.
              </p>
              <ul className="lp-data-points">
                {[
                  { dot: 'green', text: 'GPS coordinates — latitude, longitude, altitude' },
                  { dot: 'green', text: 'Engine temperature & RPM' },
                  { dot: 'green', text: 'Fuel level percentage' },
                  { dot: 'orange', text: 'Battery voltage monitoring' },
                  { dot: 'orange', text: 'Ignition and door state events' },
                ].map((p, i) => (
                  <li key={i} className="lp-data-point">
                    <span className={`lp-dp-dot lp-dp-dot--${p.dot}`} />
                    {p.text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lp-data-terminal">
              <div className="lp-terminal-bar">
                <span className="lp-terminal-dot lp-td-r" />
                <span className="lp-terminal-dot lp-td-y" />
                <span className="lp-terminal-dot lp-td-g" />
                <span className="lp-terminal-title lp-mono">MQTT Telemetry Stream</span>
              </div>
              <div className="lp-terminal-body">
                <div className="lp-terminal-line"><span className="lp-t-dim">[14:02:31]</span> <span className="lp-t-key">vehicles/MH12AB1234/telemetry</span></div>
                <div className="lp-terminal-line lp-t-indent"><span className="lp-t-field">lat</span>: <span className="lp-t-val">19.0760</span>  <span className="lp-t-field">lng</span>: <span className="lp-t-val">72.8777</span></div>
                <div className="lp-terminal-line lp-t-indent"><span className="lp-t-field">speed</span>: <span className="lp-t-val">62</span> <span className="lp-t-unit">km/h</span></div>
                <div className="lp-terminal-line lp-t-indent"><span className="lp-t-field">fuel</span>: <span className="lp-t-val lp-t-green">88%</span></div>
                <div className="lp-terminal-line lp-t-indent"><span className="lp-t-field">engine_temp</span>: <span className="lp-t-val">82</span> <span className="lp-t-unit">°C</span></div>
                <div className="lp-terminal-line lp-t-indent"><span className="lp-t-field">ignition</span>: <span className="lp-t-val lp-t-green">ON</span></div>
                <div className="lp-terminal-sep" />
                <div className="lp-terminal-line"><span className="lp-t-dim">[14:02:35]</span> <span className="lp-t-key">vehicles/GJ01GH3456/telemetry</span></div>
                <div className="lp-terminal-line lp-t-indent"><span className="lp-t-field">lat</span>: <span className="lp-t-val">23.0225</span>  <span className="lp-t-field">lng</span>: <span className="lp-t-val">72.5714</span></div>
                <div className="lp-terminal-line lp-t-indent"><span className="lp-t-field">speed</span>: <span className="lp-t-val">0</span> <span className="lp-t-unit">km/h</span></div>
                <div className="lp-terminal-line lp-t-indent"><span className="lp-t-field">fuel</span>: <span className="lp-t-val lp-t-orange">22%</span></div>
                <div className="lp-terminal-line lp-t-indent"><span className="lp-t-field">engine_temp</span>: <span className="lp-t-val lp-t-red">104</span> <span className="lp-t-unit">°C ⚠</span></div>
                <div className="lp-terminal-line lp-t-indent"><span className="lp-t-field">ignition</span>: <span className="lp-t-val lp-t-green">ON</span></div>
                <div className="lp-terminal-cursor" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <div className="lp-container">
          <div className="lp-cta-box">
            <div className="lp-cta-left">
              <h2 className="lp-cta-h2">Ready to Monitor Your Fleet?</h2>
              <p className="lp-cta-sub">Set up in minutes. No complex hardware provisioning required.</p>
            </div>
            <div className="lp-cta-right">
              <Link to="/signup" className="lp-btn lp-btn-primary lp-btn-lg">
                Start for Free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <Link to="/dashboard/overview" className="lp-btn lp-btn-outline-slate">
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-footer-logo">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill="#334155"/>
                <path d="M5 18L9 10L13 15L17 8L23 18" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <circle cx="14" cy="22" r="2" fill="#22C55E"/>
              </svg>
              <span>TelematicsHub</span>
            </div>
            <p className="lp-footer-desc">IoT-Based Smart Telematics for Real-Time Vehicle Monitoring and Fleet Management. Built for small fleet operators across India.</p>
          </div>
          <div className="lp-footer-col">
            <h4 className="lp-footer-col-title">PRODUCT</h4>
            <ul className="lp-footer-links">
              <li><Link to="/dashboard/overview">Live Demo</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/signup">Sign Up</Link></li>
            </ul>
          </div>
          <div className="lp-footer-col">
            <h4 className="lp-footer-col-title">FEATURES</h4>
            <ul className="lp-footer-links">
              <li><a>GPS Tracking</a></li>
              <li><a>Smart Alerts</a></li>
              <li><a>Document Vault</a></li>
              <li><a>Analytics</a></li>
            </ul>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© 2025 TelematicsHub</span>
          <span className="lp-footer-sep">·</span>
          <span>Built with IoT, React & Python</span>
          <span className="lp-footer-sep">·</span>
          <span className="lp-mono">v2.0.0</span>
        </div>
      </footer>
    </div>
  );
}
