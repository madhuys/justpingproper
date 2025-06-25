'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, signInWithEmail, signUpWithEmail, signInWithGoogle, logOut, resetPassword } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { checkProfileCompletion } from '@/lib/profile-utils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
      
      // Set or remove auth cookie based on user state
      if (user) {
        // Set a simple auth cookie to indicate user is logged in
        Cookies.set('auth-token', 'authenticated', { 
          expires: 7, // 7 days
          sameSite: 'lax'
        });
      } else {
        Cookies.remove('auth-token');
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext: signIn called with email:', email);
    const { user, error } = await signInWithEmail(email, password);
    console.log('AuthContext: signIn result:', { user: !!user, error });
    
    if (user) {
      console.log('AuthContext: User authenticated, checking profile completion...');
      // Set auth cookie immediately after successful sign in
      Cookies.set('auth-token', 'authenticated', { 
        expires: 7, // 7 days
        sameSite: 'lax'
      });
      
      // Check profile completion
      const profileStatus = await checkProfileCompletion();
      if (profileStatus.isComplete) {
        router.push('/home');
      } else {
        router.push('/onboarding');
      }
    }
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { user, error } = await signUpWithEmail(email, password);
    if (user) {
      // Set auth cookie immediately after successful sign up
      Cookies.set('auth-token', 'authenticated', { 
        expires: 7, // 7 days
        sameSite: 'lax'
      });
      router.push('/onboarding');
    }
    return { error };
  };

  const signInGoogle = async () => {
    console.log('AuthContext: Google sign in called');
    const { user, error } = await signInWithGoogle();
    console.log('AuthContext: Google sign in result:', { user: !!user, error });
    
    if (user) {
      console.log('AuthContext: User authenticated with Google, checking profile completion...');
      // Set auth cookie immediately after successful sign in
      Cookies.set('auth-token', 'authenticated', { 
        expires: 7, // 7 days
        sameSite: 'lax'
      });
      
      // Check profile completion
      const profileStatus = await checkProfileCompletion();
      if (profileStatus.isComplete) {
        router.push('/home');
      } else {
        router.push('/onboarding');
      }
    }
    return { error };
  };

  const logout = async () => {
    await logOut();
    Cookies.remove('auth-token');
    router.push('/login');
  };

  const resetPasswordEmail = async (email: string) => {
    const { error } = await resetPassword(email);
    return { error };
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle: signInGoogle,
    logout,
    resetPassword: resetPasswordEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};