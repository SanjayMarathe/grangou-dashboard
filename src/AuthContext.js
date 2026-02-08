/**
 * Authentication Context for Grangou Restaurant Dashboard
 * Provides auth state and methods to all components
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');

      if (token) {
        try {
          const data = await authAPI.verify();
          setUser(data.user);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('authToken');
          setUser(null);
          setIsAuthenticated(false);
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
