'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import apiClient, { ApiResponse } from '@/lib/api/client';

// User and Organization types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST';
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  limits: Record<string, any>;
  subscription: {
    plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
    status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
  } | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthUser {
  user: User;
  organization: Organization;
  tokens: AuthTokens;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Register data type
export interface RegisterData {
  organizationName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  subscriptionPlan?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Load user from token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get('access_token');
      if (token) {
        try {
          await refreshUser();
        } catch (error: any) {
          // Token invalid, clear cookies
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiClient.post<ApiResponse<AuthUser>>('/auth/login', {
        email,
        password,
      });

      const { user: userData, organization: orgData, tokens } = response.data.data;

      // Store tokens in cookies
      Cookies.set('access_token', tokens.accessToken, { expires: 1 }); // 1 day
      Cookies.set('refresh_token', tokens.refreshToken, { expires: 7 }); // 7 days

      // Update state
      setUser(userData);
      setOrganization(orgData);

      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (data: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiClient.post<ApiResponse<AuthUser>>('/auth/register', data);

      const { user: userData, organization: orgData, tokens } = response.data.data;

      // Store tokens in cookies
      Cookies.set('access_token', tokens.accessToken, { expires: 1 }); // 1 day
      Cookies.set('refresh_token', tokens.refreshToken, { expires: 7 }); // 7 days

      // Update state
      setUser(userData);
      setOrganization(orgData);

      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error: any) {
      // Ignore logout errors
    } finally {
      // Clear state and cookies
      setUser(null);
      setOrganization(null);
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      
      toast.success('Logged out successfully');
      window.location.href = '/';
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      const response = await apiClient.get<ApiResponse<User & { organization: Organization }>>('/auth/me');
      const { organization: orgData, ...userData } = response.data.data;
      
      setUser(userData);
      setOrganization(orgData);
    } catch (error: any) {
      // Clear invalid session
      setUser(null);
      setOrganization(null);
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    organization,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after loading is complete and no user
    if (!isLoading && !user) {
      // Use replace to avoid adding to history
      window.location.href = '/crm/auth/login';
    }
  }, [user, isLoading]);

  return { user, isLoading };
}

export default AuthContext;