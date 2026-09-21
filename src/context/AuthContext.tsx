// Authentication Context with 5 Role-Based Dashboards
// KRISHIFLOW-AI - Smart India Hackathon 2026

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, db } from '../lib/db';
import { supabase, isLiveSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (identifier: string, password?: string, selectedRole?: UserRole) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  registerUser: (userData: Partial<User>) => Promise<{ success: boolean; user?: User }>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Only restore user session if user explicitly logged in during an active session
    const isLoggedIn = localStorage.getItem('kf_is_logged_in');
    if (isLoggedIn === 'true') {
      const saved = localStorage.getItem('kf_current_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    } else {
      // Clear any legacy auto-login data so site visits start in a logged-out state
      localStorage.removeItem('kf_current_user');
      localStorage.removeItem('kf_is_logged_in');
    }
    return null; // Public visitors start logged out
  });

  const role = user?.role || null;
  const isAuthenticated = !!user;

  useEffect(() => {
    if (user) {
      localStorage.setItem('kf_current_user', JSON.stringify(user));
      localStorage.setItem('kf_is_logged_in', 'true');
    } else {
      localStorage.removeItem('kf_current_user');
      localStorage.removeItem('kf_is_logged_in');
    }
  }, [user]);

  // Real-time synchronization when user record is updated in DB
  useEffect(() => {
    if (!user?.id) return;
    const unsub = db.subscribe('table:users', (usersList: User[]) => {
      const match = usersList.find((u) => u.id === user.id || u.email === user.email);
      if (match) {
        if (
          match.name !== user.name ||
          match.avatar_url !== user.avatar_url ||
          match.phone !== user.phone
        ) {
          setUser(match);
        }
      }
    });
    return () => unsub();
  }, [user?.id, user?.name, user?.avatar_url, user?.phone]);

  const login = async (identifier: string, enteredPassword?: string, selectedRole?: UserRole): Promise<{ success: boolean; user?: User; error?: string }> => {
    const cleanId = (identifier || '').trim();
    const idDigits = cleanId.replace(/\D/g, '');
    const users = db.getCollection<User>('users');

    // 1. Try finding user by exact email, or matching digits of phone
    let matched = users.find((u) => {
      // Email match
      if (u.email && u.email.toLowerCase() === cleanId.toLowerCase()) return true;
      // Phone match
      if (idDigits && idDigits.length >= 10 && u.phone) {
        const uPhoneDigits = u.phone.replace(/\D/g, '');
        if (uPhoneDigits === idDigits) return true;
        if (uPhoneDigits.endsWith(idDigits) || idDigits.endsWith(uPhoneDigits)) return true;
      }
      return false;
    });

    // 2. Fallback: If 1-click evaluation or demo role email match
    if (!matched && selectedRole) {
      if (cleanId.includes('@krishiflow.ai') || cleanId.includes(selectedRole)) {
        matched = users.find((u) => u.role === selectedRole);
      }
    }

    if (matched) {
      // Check password if set on user
      if (enteredPassword) {
        // Also allow role default demo passwords for 1-click test evaluation
        const roleBase = matched.role.replace('_officer', '');
        const isRoleDefaultPass = 
          enteredPassword === `${matched.role}123` || 
          enteredPassword === `${roleBase}123` || 
          enteredPassword === 'password123' ||
          enteredPassword === 'farmer123';
        
        if (matched.password && matched.password !== enteredPassword && !isRoleDefaultPass) {
          return {
            success: false,
            error: 'Incorrect password. Please enter the password you created during registration.'
          };
        }
      }

      // STATE MANAGER APPROVAL & REVOCATION CHECK
      // Manager role is always permitted as system administrator
      if (matched.role !== 'manager') {
        if (matched.approval_status === 'pending') {
          return {
            success: false,
            error: '⏳ Account Pending Verification: Aapka registration State Manager ke verification ke liye pending hai. Manager dwara verify/approve hone ke baad hi aap login kar sakte hain.'
          };
        }

        if (matched.approval_status === 'rejected' || matched.account_status === 'suspended') {
          return {
            success: false,
            error: '🚫 Access Revoked: Aapka account registration State Manager dwara revoke/suspend kar diya gaya hai. Aap login nahi kar sakte.'
          };
        }
      }

      setUser(matched);
      return { success: true, user: matched };
    }

    return {
      success: false,
      error: 'No account found with this mobile number or email. Please register your account first.'
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kf_current_user');
    localStorage.removeItem('kf_is_logged_in');
    if (isLiveSupabaseConfigured()) {
      supabase.auth.signOut().catch(() => {});
    }
  };

  const switchRole = (newRole: UserRole) => {
    const users = db.getCollection<User>('users');
    const matched = users.find((u) => u.role === newRole);
    if (matched) {
      setUser(matched);
    } else {
      const fallbackUser: User = {
        id: `usr-${newRole}`,
        role: newRole,
        name: `Officer / ${newRole.toUpperCase()}`,
        email: `${newRole}@krishiflow.ai`,
        phone: '+919876543200',
        approval_status: newRole === 'manager' ? 'approved' : 'pending',
        account_status: 'active',
        created_at: new Date().toISOString(),
      };
      setUser(fallbackUser);
    }
  };

  const registerUser = async (userData: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> => {
    if (userData.phone) {
      const phoneCheck = db.isPhoneRegistered(userData.phone);
      if (phoneCheck.registered) {
        return { success: false, error: phoneCheck.message || 'This mobile number is already registered in the system.' };
      }
    }

    const users = db.getCollection<User>('users');
    const newUser: User = {
      id: `usr-${Date.now()}`,
      role: userData.role || 'farmer',
      name: userData.name || 'New Registered User',
      email: userData.email || `user${Date.now()}@krishiflow.ai`,
      phone: userData.phone || '+919876500000',
      password: userData.password,
      approval_status: userData.role === 'manager' ? 'approved' : 'pending',
      account_status: 'active',
      created_at: new Date().toISOString(),
      ...userData,
    };

    users.push(newUser);
    db.setCollection('users', users);
    return { success: true, user: newUser };
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('kf_current_user', JSON.stringify(updated));

    const users = db.getCollection<User>('users');
    const idx = users.findIndex((u) => u.id === user.id || u.email === user.email);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...updates };
      db.setCollection('users', users);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        login,
        logout,
        switchRole,
        registerUser,
        updateUser,
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
