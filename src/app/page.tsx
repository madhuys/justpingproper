'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from '@/components/atoms/Loader';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, check onboarding state
        const onboardingComplete = localStorage.getItem('onboarding_complete');
        
        if (!onboardingComplete) {
          // Start onboarding flow
          router.push('/onboarding');
        } else {
          // Onboarding complete, go to home
          router.push('/home');
        }
      } else {
        // User is not authenticated, redirect to login
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader />
    </div>
  );
}