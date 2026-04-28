import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken, clearToken, getStoredUser, storeUser } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser,  setCurrentUser]  = useState(null);
  const [userRole,     setUserRole]     = useState('owner');
  const [userProfile,  setUserProfile]  = useState(null);
  const [authLoading,  setAuthLoading]  = useState(true);

  // Rehydrate session from localStorage on page load
  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();
    if (token && stored) {
      setCurrentUser({ uid: stored.uid, email: stored.email });
      setUserRole(stored.role || 'owner');
      setUserProfile(stored);
      // Refresh profile from server in background
      api.get('/api/auth/me')
        .then(profile => {
          storeUser(profile);
          setCurrentUser({ uid: profile.uid, email: profile.email });
          setUserRole(profile.role || 'owner');
          setUserProfile(profile);
        })
        .catch(() => {
          // Token expired — clear session
          clearToken();
          setCurrentUser(null);
          setUserRole('owner');
          setUserProfile(null);
        })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  async function login(email, password) {
    const data = await api.post('/api/auth/login', { email, password });
    setToken(data.token);
    storeUser(data);
    setCurrentUser({ uid: data.uid, email: data.email });
    setUserRole(data.role || 'owner');
    setUserProfile(data);
    return { user: { uid: data.uid, email: data.email }, role: data.role };
  }

  async function signup(firstName, lastName, email, phone, password, role, assignedVehicle = '') {
    const data = await api.post('/api/auth/signup', {
      firstName, lastName, email, phone, password, role,
      assignedVehicle: role === 'driver' ? assignedVehicle.trim() : '',
    });
    setToken(data.token);
    storeUser(data);
    setCurrentUser({ uid: data.uid, email: data.email });
    setUserRole(data.role || 'owner');
    setUserProfile(data);
    return { uid: data.uid, email: data.email };
  }

  async function updateProfile(updates) {
    if (!currentUser) return;
    const profile = await api.put('/api/auth/me', updates);
    storeUser(profile);
    setUserProfile(profile);
  }

  function logout() {
    clearToken();
    setCurrentUser(null);
    setUserRole('owner');
    setUserProfile(null);
  }

  return (
    <AuthContext.Provider value={{
      currentUser, userRole, userProfile, authLoading,
      login, signup, logout, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
