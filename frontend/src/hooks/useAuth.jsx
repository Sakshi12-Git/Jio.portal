import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const [role, setRole]   = useState(() => localStorage.getItem('role') || null);

  const login = (t, u, r) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('role', r);
    setToken(t); setUser(u); setRole(r);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setToken(null); setUser(null); setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, role, login, logout, isAdmin: role === 'admin', isEmployee: role === 'employee' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
