import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

const ADMIN_PASSWORD = '628400@thrylosindia';
const ADMIN_SESSION_KEY = 'thrylos_admin_session';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  loading: boolean;
  adminLogin: (password: string) => boolean;
  adminLogout: () => void;
  getAdminToken: () => string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (session === 'authenticated') {
      setIsAdminAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const adminLogin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated');
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdminAuthenticated(false);
  };

  const getAdminToken = (): string | null => {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'authenticated' ? ADMIN_PASSWORD : null;
  };

  return (
    <AdminAuthContext.Provider value={{ 
      isAdminAuthenticated, 
      loading, 
      adminLogin, 
      adminLogout,
      getAdminToken 
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
