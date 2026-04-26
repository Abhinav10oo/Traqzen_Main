import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser,  setCurrentUser]  = useState(null);
  const [userRole,     setUserRole]     = useState('owner');
  const [userProfile,  setUserProfile]  = useState(null);
  const [authLoading,  setAuthLoading]  = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const profile = snap.data();
            setUserRole(profile.role || 'owner');
            setUserProfile(profile);
          }
        } catch {
          setUserRole('owner');
          setUserProfile(null);
        }
      } else {
        setCurrentUser(null);
        setUserRole('owner');
        setUserProfile(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Sign in with email + password
  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    try {
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      const profile = snap.exists() ? snap.data() : {};
      const role = profile.role || 'owner';
      setUserRole(role);
      setUserProfile(profile);
      return { user: cred.user, role };
    } catch {
      // Profile fetch failed (Firestore rules) — login still succeeds
      setUserRole('owner');
      setUserProfile(null);
      return { user: cred.user, role: 'owner' };
    }
  }

  // Create account + save profile to Firestore
  async function signup(firstName, lastName, email, phone, password, role, assignedVehicle = '') {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const name = `${firstName} ${lastName}`.trim();
    const profile = { firstName, lastName, name, email, phone, role, createdAt: serverTimestamp(),
      ...(role === 'driver' && assignedVehicle ? { assignedVehicle: assignedVehicle.trim() } : {}) };
    try {
      await setDoc(doc(db, 'users', cred.user.uid), profile);
    } catch {
      // Firestore rules blocked profile save — auth still succeeded
    }
    setUserRole(role);
    setUserProfile(profile);
    return cred.user;
  }

  // Update user profile in Firestore and local state
  async function updateProfile(updates) {
    if (!currentUser) return;
    const { doc: firestoreDoc, updateDoc } = await import('firebase/firestore');
    await updateDoc(firestoreDoc(db, 'users', currentUser.uid), updates);
    setUserProfile(prev => ({ ...prev, ...updates }));
  }

  // Sign out
  function logout() {
    return signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ currentUser, userRole, userProfile, authLoading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
