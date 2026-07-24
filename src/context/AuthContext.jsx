import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await authApi.getCurrentSession();
        if (session && session.user) {
          setUser(session.user);
          setToken(session.token);
        }
      } catch (err) {
        console.error("Failed to restore session", err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const session = await authApi.login(email, password);
      setUser(session.user);
      setToken(session.token);
      return session.user;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    if (!user) return;
    setLoading(true);
    try {
      const updatedUser = await authApi.updateUserProfile(user.id, profileData);
      setUser({
        ...user,
        name: updatedUser.name,
        email: updatedUser.email,
        department: updatedUser.department,
        companyName: updatedUser.companyName
      });
      return updatedUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, updateProfile, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
