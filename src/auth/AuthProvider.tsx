import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserDTO } from '../shared/index.js';
import { api, setAccessToken, getAccessToken } from '../api/client.js';

interface AuthContextType {
  user: UserDTO | null;
  loading: boolean;
  login: (email: string, pass: string, twoFactorCode?: string) => Promise<{ requires2FA?: boolean; tempToken?: string }>;
  verify2FA: (tempToken: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      if (getAccessToken()) {
        const profile = await api.get<UserDTO>('/auth/me');
        setUser(profile);
      } else {
        // Try refresh token in cookie
        const res = await api.post<{ user: UserDTO; accessToken: string }>('/auth/refresh');
        if (res?.accessToken) {
          setAccessToken(res.accessToken);
          setUser(res.user);
        }
      }
    } catch {
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, pass: string, twoFactorCode?: string) => {
    const res = await api.post<{
      user: UserDTO;
      accessToken: string;
      requires2FA?: boolean;
      tempToken?: string;
    }>('/auth/login', {
      email,
      password: pass,
      twoFactorCode,
    });

    if (res.requires2FA) {
      return { requires2FA: true, tempToken: res.tempToken };
    }

    setAccessToken(res.accessToken);
    setUser(res.user);
    return { requires2FA: false };
  };

  const verify2FA = async (tempToken: string, code: string) => {
    const res = await api.post<{ user: UserDTO; accessToken: string }>('/auth/login/2fa', {
      tempToken,
      code,
    });

    setAccessToken(res.accessToken);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    const profile = await api.get<UserDTO>('/auth/me');
    setUser(profile);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verify2FA, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
