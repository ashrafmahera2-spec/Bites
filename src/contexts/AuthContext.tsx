import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: any | null;
  isAdmin: boolean;
  loading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin-token');
    if (token) {
      setIsAdmin(true);
      setUser({ role: 'admin' });
    }
    setLoading(false);
  }, []);

  const login = async (password: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('admin-token', data.token);
        setIsAdmin(true);
        setUser({ role: 'admin' });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Auth login error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin-token');
    setIsAdmin(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
