import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '../api/client';
import type { AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    isLoading: true,
  });

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setState({
        user: response.data.data,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data.data;

    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    setState({
      user,
      token: accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
