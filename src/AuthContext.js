/**
 * Authentication Context for Grangou Restaurant Dashboard
 * Provides auth state and methods to all components
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from './api';

const AuthContext = createContext(null);

/** Derive entitlement when API omits it (e.g. older Edge deploy). */
export function deriveEntitlement(user) {
  if (!user) {
    return { canUseDashboard: false, trialEndsAt: null, licensed: false };
  }
  const licensed = user.license_activated_at != null;
  const trialEndMs = user.trial_ends_at ? new Date(user.trial_ends_at).getTime() : 0;
  const inTrial = !!user.trial_ends_at && Date.now() < trialEndMs;
  return {
    canUseDashboard: licensed || inTrial,
    trialEndsAt: user.trial_ends_at,
    licensed,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [entitlement, setEntitlement] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const applyAuthPayload = useCallback((data) => {
    setUser(data.user);
    setEntitlement(data.entitlement ?? deriveEntitlement(data.user));
    setIsAuthenticated(true);
  }, []);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');

      if (token) {
        try {
          const data = await authAPI.verify();
          applyAuthPayload(data);
        } catch (error) {
          localStorage.removeItem('authToken');
          setUser(null);
          setEntitlement(null);
          setIsAuthenticated(false);
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [applyAuthPayload]);

  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      applyAuthPayload(data);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (formData) => {
    try {
      const data = await authAPI.register(formData);
      applyAuthPayload(data);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /** Re-fetch user + entitlement from verify (e.g. after trial expires mid-session). */
  const refreshSession = async () => {
    const data = await authAPI.verify();
    applyAuthPayload(data);
    return data;
  };

  const activateLicense = async (code) => {
    const data = await authAPI.activateLicense(code);
    applyAuthPayload({
      user: data.user,
      entitlement: data.entitlement ?? deriveEntitlement(data.user),
    });
    return { success: true };
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setEntitlement(null);
      setIsAuthenticated(false);
    }
  };

  const canUseDashboard = entitlement?.canUseDashboard ?? false;

  const value = {
    user,
    entitlement,
    canUseDashboard,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshSession,
    activateLicense,
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
