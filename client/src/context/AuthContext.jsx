import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance, { setAuthHeader } from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize access token changes with the Axios API client common headers
  useEffect(() => {
    setAuthHeader(accessToken);
  }, [accessToken]);

  // Initial silent auth refresh on component mount
  useEffect(() => {
    const checkSilentRefresh = async () => {
      try {
        const response = await axiosInstance.post('/auth/refresh');
        const { user, accessToken } = response.data;
        setUser(user);
        setAccessToken(accessToken);
      } catch (error) {
        console.log('[Auth] Silent refresh failed or user is not logged in.');
      } finally {
        setLoading(false);
      }
    };

    checkSilentRefresh();

    // Reset memory credentials when token expires or refresh calls fail
    const handleAuthExpired = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      const { user, accessToken } = response.data;
      setUser(user);
      setAccessToken(accessToken);
      return user;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const signup = async (name, email, password) => {
    try {
      const response = await axiosInstance.post('/auth/signup', { name, email, password });
      const { user, accessToken } = response.data;
      setUser(user);
      setAccessToken(accessToken);
      return user;
    } catch (error) {
      throw error.response?.data?.message || 'Signup failed';
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('[Auth] Error executing logout request', error);
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axiosInstance.put('/users/me', profileData);
      setUser(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Profile update failed';
    }
  };

  const value = {
    user,
    accessToken,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    isAuthenticated: !!user,
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
