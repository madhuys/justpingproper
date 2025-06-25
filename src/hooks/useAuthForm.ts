'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UseAuthFormProps {
  mode: 'signin' | 'signup' | 'forgot-password' | 'reset-password';
}

export function useAuthForm({ mode }: UseAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, resetPassword, signInWithGoogle } = useAuth();

  const handleEmailAuth = async (email: string, password: string) => {
    setError('');
    setIsLoading(true);

    try {
      let result;
      if (mode === 'signin') {
        result = await signIn(email, password);
      } else if (mode === 'signup') {
        result = await signUp(email, password);
      } else {
        throw new Error('Invalid auth mode');
      }

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
      }
      // If successful, the auth context will handle routing
    } catch (err) {
      console.error(`${mode} error:`, err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setIsLoading(true);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error);
        setIsLoading(false);
      }
      // If successful, the auth context will handle routing
    } catch (err) {
      console.error('Google auth error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    setError('');
    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error);
      }
      setIsLoading(false);
      return { error };
    } catch (err) {
      console.error('Password reset error:', err);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
      return { error: errorMessage };
    }
  };

  const clearError = () => setError('');

  return {
    isLoading,
    error,
    handleEmailAuth,
    handleGoogleAuth,
    handlePasswordReset,
    clearError,
    setError,
  };
}