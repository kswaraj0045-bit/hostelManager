import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService.getMe()
        .then((res) => {
          if (res.data?.success) setUser(res.data.data);
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const setAuthenticatedUser = (data) => {
    if (!data) return null;

    const { token, ...userData } = data;
    if (token) {
      localStorage.setItem('token', token);
    }
    setUser(userData);
    return userData;
  };

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.data?.success) {
      return res.data.data?.token ? setAuthenticatedUser(res.data.data) : res.data.data;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const register = async (name, email, password, phone = '') => {
    const res = await authService.register({ name, email, password, phone });
    if (res.data?.success) {
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  const refreshUser = async () => {
    const res = await authService.getMe();
    if (res.data?.success) {
      setUser(res.data.data);
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to fetch user');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setAuthenticatedUser, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
