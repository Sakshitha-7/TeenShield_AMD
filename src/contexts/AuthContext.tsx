import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AuthState, UserRole } from '@/lib/types';

interface AuthContextType extends AuthState {
  login: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  role: null,
  userId: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    userId: null,
  });

  const login = useCallback((role: UserRole) => {
    setAuth({
      isAuthenticated: true,
      role,
      userId: role === 'teen' ? 'teen-001' : 'parent-001',
    });
  }, []);

  const logout = useCallback(() => {
    setAuth({ isAuthenticated: false, role: null, userId: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
