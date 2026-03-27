import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingNavbar.css';

export default function LandingNavbar() {
  const [visible, setVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      // Show navbar after scrolling past 80% of viewport height (past hero)
      setVisible(y > window.innerHeight * 0.8);
      setScrolled(y > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`landing-nav ${visible ? 'nav-visible' : 'nav-hidden'} ${scrolled ? 'nav-scrolled' : ''}`}>
      <div className="landing-nav-inner">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <div className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="var(--primary)"/>
              <path d="M6 18 L10 10 L14 15 L18 8 L22 18" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="14" cy="22" r="2" fill="white"/>
            </svg>
          </div>
          <span>TelematicsHub</span>
        </Link>

        {/* Auth buttons */}
        <div className="nav-actions">
          <Link to="/login" className="btn btn-ghost btn-sm">Log In</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
        </div>
      </div>
    </nav>
  );
}
