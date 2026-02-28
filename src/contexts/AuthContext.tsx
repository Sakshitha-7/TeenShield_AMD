import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AuthState, UserRole } from '@/lib/types';

interface AuthContextType extends AuthState {
  userName?: string | null;
  login: (email: string, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  role: null,
  userId: null,
  userName: null,
  login: async () => { },
  logout: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState & { userName?: string | null }>({
    isAuthenticated: false,
    role: null,
    userId: null,
    userName: null,
  });

  const login = useCallback(async (email: string, role: string) => {
    try {
      const { dbApi, setToken } = await import('@/lib/db-api');
      const response = await dbApi.login(email, role);

      setToken(response.token);
      setAuth({
        isAuthenticated: true,
        role: response.user.role as UserRole,
        userId: response.user.id,
        userName: response.user.name
      });
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    const { clearToken } = await import('@/lib/db-api');
    clearToken();
    setAuth({ isAuthenticated: false, role: null, userId: null, userName: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
