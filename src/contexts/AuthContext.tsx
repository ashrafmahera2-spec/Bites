import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: any | null;
  isAdmin: boolean;
  isCustomer: boolean;
  loading: boolean;
  login: (username: string, password?: string) => Promise<boolean>;
  customerLogin: (phone: string, password?: string) => Promise<boolean>;
  customerRegister: (data: any) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminToken = localStorage.getItem('admin-token');
    const adminUserData = localStorage.getItem('admin-user');
    const customerToken = localStorage.getItem('customer-token');
    const customerUserData = localStorage.getItem('customer-user');

    if (adminToken && adminUserData) {
      const parsedUser = JSON.parse(adminUserData);
      setUser(parsedUser);
      setIsAdmin(true);
      setIsCustomer(false);
    } else if (customerToken && customerUserData) {
      const parsedUser = JSON.parse(customerUserData);
      setUser(parsedUser);
      setIsAdmin(false);
      setIsCustomer(true);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password?: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('admin-token', data.token);
        localStorage.setItem('admin-user', JSON.stringify(data.user));
        localStorage.removeItem('customer-token');
        localStorage.removeItem('customer-user');
        setUser(data.user);
        setIsAdmin(true);
        setIsCustomer(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Auth login error:", error);
      return false;
    }
  };

  const customerLogin = async (phone: string, password?: string) => {
    try {
      const response = await fetch('/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('customer-token', data.token);
        localStorage.setItem('customer-user', JSON.stringify(data.user));
        localStorage.removeItem('admin-token');
        localStorage.removeItem('admin-user');
        setUser(data.user);
        setIsAdmin(false);
        setIsCustomer(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Customer login error:", error);
      return false;
    }
  };

  const customerRegister = async (data: any) => {
    try {
      const response = await fetch('/api/customers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const result = await response.json();
        localStorage.setItem('customer-token', result.token);
        localStorage.setItem('customer-user', JSON.stringify(result.user));
        localStorage.removeItem('admin-token');
        localStorage.removeItem('admin-user');
        setUser(result.user);
        setIsAdmin(false);
        setIsCustomer(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Customer register error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin-token');
    localStorage.removeItem('admin-user');
    localStorage.removeItem('customer-token');
    localStorage.removeItem('customer-user');
    setIsAdmin(false);
    setIsCustomer(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isCustomer, loading, login, customerLogin, customerRegister, logout }}>
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
