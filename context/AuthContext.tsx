import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { toast } from 'sonner';

interface AuthContextType extends AuthState {
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, name: string, username: string) => Promise<void>;
  updateUserProfile: (name: string, avatar: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const checkAuth = async () => {
    const token = localStorage.getItem('unifound_token');
    if (!token) {
      setState({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('unifound_user', JSON.stringify(data.user));
        setState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        localStorage.removeItem('unifound_token');
        localStorage.removeItem('unifound_user');
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const refreshUser = async () => {
    await checkAuth();
  };

  const loginWithEmail = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });
      console.log('[AUTH] Login response status:', response.status);
      clearTimeout(timeoutId);

      const data = await response.json();
      console.log('[AUTH] Login data received:', !!data.token);
      if (!response.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('unifound_token', data.token);
      localStorage.setItem('unifound_user', JSON.stringify(data.user));
      console.log('[AUTH] Stored token and user in localStorage');
      
      setState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false
      });
      console.log('[AUTH] Updated state, isAuthenticated: true');
      toast.success('Welcome back!');
    } catch (error: any) {
      clearTimeout(timeoutId);
      setState(prev => ({ ...prev, isLoading: false }));
      if (error.name === 'AbortError') {
        toast.error('Login request timed out. Please try again.');
      } else {
        toast.error(error.message);
      }
      throw error;
    }
  };

  const signupWithEmail = async (email: string, password: string, name: string, username: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, username }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Signup failed');

      localStorage.setItem('unifound_token', data.token);
      localStorage.setItem('unifound_user', JSON.stringify(data.user));
      setState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false
      });
      toast.success('Account created! Please check your email for verification.');
    } catch (error: any) {
      clearTimeout(timeoutId);
      setState(prev => ({ ...prev, isLoading: false }));
      if (error.name === 'AbortError') {
        toast.error('Signup request timed out. Please try again.');
      } else {
        toast.error(error.message);
      }
      throw error;
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Verification failed');

      // Update local state and storage
      if (state.user) {
        const updatedUser = { ...state.user, isVerified: true };
        localStorage.setItem('unifound_user', JSON.stringify(updatedUser));
        setState(prev => ({ ...prev, user: updatedUser }));
      } else {
        // If not logged in, we can't update state.user, but the DB is updated.
        // The user will see the verified status when they next login.
      }
      toast.success('Email verified successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const resendVerification = async () => {
    const token = localStorage.getItem('unifound_token');
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to resend verification');

      toast.success('Verification email resent! Please check your inbox.');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const updateUserProfile = async (name: string, avatar: string) => {
    const token = localStorage.getItem('unifound_token');
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, avatar })
      });

      if (!response.ok) throw new Error('Failed to update profile');
      
      const updatedUser = state.user ? { ...state.user, name, avatar } : null;
      if (updatedUser) {
        localStorage.setItem('unifound_user', JSON.stringify(updatedUser));
      }

      setState(prev => ({
        ...prev,
        user: updatedUser
      }));
      toast.success('Profile updated!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('unifound_token');
    localStorage.removeItem('unifound_user');
    setState({ user: null, isAuthenticated: false, isLoading: false });
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ ...state, loginWithEmail, signupWithEmail, updateUserProfile, verifyEmail, resendVerification, refreshUser, logout }}>
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
