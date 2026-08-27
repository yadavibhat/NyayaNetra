import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbService, getStoredSession } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getStoredSession());
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const sess = await dbService.login(credentials);
      setSession(sess);
      return sess;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data) => {
    setLoading(true);
    try {
      const sess = await dbService.signup(data);
      setSession(sess);
      return sess;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (session?.profile?.id) {
      await dbService.logout(session.profile.id);
    }
    setSession(null);
  };

  const refreshProfile = () => {
    if (session?.profile?.id) {
      const updated = dbService.getDB().profiles.find(p => p.id === session.profile.id);
      if (updated) {
        const newSession = { ...session, profile: updated };
        setSession(newSession);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ session, login, signup, logout, refreshProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
