import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { apiConfig } from '@/config/api';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  location: string;
  role: 'Admin' | 'User' | 'SuperAdmin';
  avatar?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  location: string;
  role: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  
  // SSO Actions
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Login Action
        login: async (credentials: LoginCredentials) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(credentials),
            });

            if (!response.ok) {
              throw new Error('Invalid credentials');
            }

            const { user, message } = await response.json();
            
            // Token is now stored as httpOnly cookie by the API route
            
            set({ 
              user: {
                ...user,
                createdAt: new Date(user.createdAt),
                updatedAt: new Date(user.updatedAt),
                lastLoginAt: new Date()
              }, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Login failed', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Register Action
        register: async (data: RegisterData) => {
          set({ isLoading: true, error: null });
          
          try {
            // TODO: Replace with actual API call
            const response = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Registration failed');
            }

            const { message } = await response.json();
            
            // Don't auto-login, require email verification
            set({ isLoading: false });
            
            return Promise.resolve();
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Registration failed', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Logout Action
        logout: () => {
          localStorage.removeItem('authToken');
          set({ 
            user: null, 
            isAuthenticated: false, 
            error: null 
          });
        },

        // Update Profile Action
        updateProfile: async (data: Partial<UserProfile>) => {
          const { user } = get();
          if (!user) throw new Error('No user logged in');

          set({ isLoading: true, error: null });
          
          try {
            // TODO: Replace with actual API call
            const response = await fetch(`/api/users/${user.id}`, {
              method: 'PATCH',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              },
              body: JSON.stringify(data),
            });

            if (!response.ok) {
              throw new Error('Failed to update profile');
            }

            const updatedUser = await response.json();
            
            set({ 
              user: {
                ...updatedUser,
                createdAt: new Date(updatedUser.createdAt),
                updatedAt: new Date(updatedUser.updatedAt)
              }, 
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update profile', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Forgot Password Action
        forgotPassword: async (email: string) => {
          set({ isLoading: true, error: null });
          
          try {
            // TODO: Replace with actual API call
            const response = await fetch('/api/auth/forgot-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });

            if (!response.ok) {
              throw new Error('Failed to send reset email');
            }

            set({ isLoading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to send reset email', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Reset Password Action
        resetPassword: async (token: string, password: string) => {
          set({ isLoading: true, error: null });
          
          try {
            // TODO: Replace with actual API call
            const response = await fetch('/api/auth/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, password }),
            });

            if (!response.ok) {
              throw new Error('Failed to reset password');
            }

            set({ isLoading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to reset password', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Verify Email Action
        verifyEmail: async (token: string) => {
          set({ isLoading: true, error: null });
          
          try {
            // TODO: Replace with actual API call
            const response = await fetch('/api/auth/verify-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token }),
            });

            if (!response.ok) {
              throw new Error('Failed to verify email');
            }

            const { user } = get();
            if (user) {
              set({ 
                user: { 
                  ...user, 
                  emailVerified: true 
                },
                isLoading: false 
              });
            }
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to verify email', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Google SSO Action
        loginWithGoogle: async () => {
          set({ isLoading: true, error: null });
          
          try {
            // TODO: Implement Google SSO
            // This would typically redirect to Google OAuth
            window.location.href = '/api/auth/google';
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Google login failed', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Microsoft SSO Action
        loginWithMicrosoft: async () => {
          set({ isLoading: true, error: null });
          
          try {
            // TODO: Implement Microsoft SSO
            // This would typically redirect to Microsoft OAuth
            window.location.href = '/api/auth/microsoft';
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Microsoft login failed', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Utility Actions
        clearError: () => set({ error: null }),
        setLoading: (loading: boolean) => set({ isLoading: loading }),
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({ 
          user: state.user, 
          isAuthenticated: state.isAuthenticated 
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);