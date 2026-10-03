import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  demoUsers: User[];
  loading: boolean;
  loginAs: (userId: string) => Promise<User>;
  switchUser: (user: User) => void;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  canApprove: (requiredLevel: number) => { allowed: boolean; reason?: string };
  resetStoreData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load demo users and active session on mount
  useEffect(() => {
    async function initAuth() {
      try {
        const response = await api.getDemoUsers();
        if (response.success && response.data) {
          setDemoUsers(response.data);

          // Check if previously logged in
          const saved = localStorage.getItem('vendorgate_active_user');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              // Verify against current list
              const matched = response.data.find(u => u.id === parsed.id);
              if (matched) {
                setUser(matched);
              } else {
                localStorage.removeItem('vendorgate_active_user');
              }
            } catch {
              localStorage.removeItem('vendorgate_active_user');
            }
          }
          // Do NOT default to any user if nothing in storage.
          // This ensures the Login / Persona Selection page opens first.
        }
      } catch (err) {
        console.error('Failed to load demo users:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const loginAs = async (userId: string): Promise<User> => {
    const res = await api.loginDemoUser(userId);
    if (res.success && res.data) {
      setUser(res.data);
      localStorage.setItem('vendorgate_active_user', JSON.stringify(res.data));
      return res.data;
    }
    throw new Error(res.message || 'Login failed');
  };

  const switchUser = (selectedUser: User) => {
    setUser(selectedUser);
    localStorage.setItem('vendorgate_active_user', JSON.stringify(selectedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vendorgate_active_user');
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true; // Admin has system-wide access
    return roles.includes(user.role);
  };

  const canApprove = (requiredLevel: number): { allowed: boolean; reason?: string } => {
    if (!user) {
      return { allowed: false, reason: 'Authentication required' };
    }
    if (user.role === 'ADMIN') {
      return { allowed: true };
    }
    if (user.role !== 'APPROVER') {
      return {
        allowed: false,
        reason: `Role '${user.role}' lacks PO approval authority. Approver credentials required.`,
      };
    }
    const userLevel = Number(user.approvalLevel) || 0;
    if (userLevel < requiredLevel) {
      return {
        allowed: false,
        reason: `Approval Restricted: Your approval authority is Level ${userLevel}. This PO requires Level ${requiredLevel} approval.`,
      };
    }
    return { allowed: true };
  };

  const resetStoreData = async () => {
    await api.resetDemoData();
    // Refresh demo users list
    const res = await api.getDemoUsers();
    if (res.success) {
      setDemoUsers(res.data);
      if (user) {
        const refreshed = res.data.find(u => u.id === user.id);
        if (refreshed) {
          setUser(refreshed);
          localStorage.setItem('vendorgate_active_user', JSON.stringify(refreshed));
        }
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        demoUsers,
        loading,
        loginAs,
        switchUser,
        logout,
        hasRole,
        canApprove,
        resetStoreData,
      }}
    >
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
