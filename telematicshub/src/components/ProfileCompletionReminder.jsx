import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './ProfileCompletionReminder.css';

export default function ProfileCompletionReminder() {
  const { currentUser, userProfile } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [missing, setMissing] = useState([]);

  useEffect(() => {
    if (!currentUser || !userProfile) return;

    async function check() {
      const items = [];

      if (!userProfile.firstName) items.push('First name');
      if (!userProfile.lastName)  items.push('Last name');
      if (!userProfile.phone)     items.push('Phone number');

      // Check if user has uploaded at least one verification document
      try {
        const q = query(
          collection(db, 'documents'),
          where('uploaded_by', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        if (snap.empty) items.push('Verification document');
      } catch {
        // If Firestore unavailable, don't block the check
      }

      setMissing(items);
    }

    check();
  }, [currentUser, userProfile]);

  // Don't show if dismissed, or profile is already complete
  if (dismissed || missing.length === 0) return null;

  return (
    <div className="pcr-card">
      <button className="pcr-close" onClick={() => setDismissed(true)} title="Dismiss">✕</button>
      <div className="pcr-icon">🛡️</div>
      <div className="pcr-body">
        <div className="pcr-title">Complete Your Profile</div>
        <div className="pcr-message">
          Missing: {missing.join(', ')}
        </div>
        <Link to="/dashboard/profile-verification" className="btn btn-primary btn-sm pcr-btn">
          Complete Now
        </Link>
      </div>
    </div>
  );
}
