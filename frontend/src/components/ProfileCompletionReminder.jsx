import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import './ProfileCompletionReminder.css';

export default function ProfileCompletionReminder() {
  const { currentUser, userProfile } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [missing, setMissing]     = useState([]);

  useEffect(() => {
    if (!currentUser || !userProfile) return;

    async function check() {
      const items = [];
      if (!userProfile.firstName) items.push('First name');
      if (!userProfile.lastName)  items.push('Last name');
      if (!userProfile.phone)     items.push('Phone number');

      try {
        const docs = await api.get('/api/documents/');
        if (!docs || docs.length === 0) items.push('Verification document');
      } catch {
        // Non-blocking
      }

      setMissing(items);
    }

    check();
  }, [currentUser, userProfile]);

  if (dismissed || missing.length === 0) return null;

  return (
    <div className="pcr-card">
      <button className="pcr-close" onClick={() => setDismissed(true)} title="Dismiss">✕</button>
      <div className="pcr-icon">🛡️</div>
      <div className="pcr-body">
        <div className="pcr-title">Complete Your Profile</div>
        <div className="pcr-message">Missing: {missing.join(', ')}</div>
        <Link to="/dashboard/profile-verification" className="btn btn-primary btn-sm pcr-btn">
          Complete Now
        </Link>
      </div>
    </div>
  );
}
