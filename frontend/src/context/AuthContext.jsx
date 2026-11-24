import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Inicializar solo una vez al montar
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        try {
          const response = await api.get('/auth/me');
          if (mounted) setUser(response.data.data);
        } catch {
          if (mounted) logout();
        } finally {
          if (mounted) setLoading(false);
        }
      } else {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    return () => { mounted = false; };
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const response = await api.post('/auth/login', { email, password, rememberMe });
    const { user: userData, token: newToken } = response.data.data;
    setUser(userData);
    setToken(newToken);
    localStorage.setItem('auth_token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    return response.data;
  };

  const register = async (data) => {
    const response = await api.post('/auth/register', data);
    const { user: userData, token: newToken } = response.data.data;
    setUser(userData);
    setToken(newToken);
    localStorage.setItem('auth_token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    return response.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    delete api.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (data) => {
    const response = await api.put('/auth/me', data);
    setUser(response.data.data);
    return response.data;
  };

  const changePassword = async (data) => {
    const response = await api.put('/auth/me/password', data);
    return response.data;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
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