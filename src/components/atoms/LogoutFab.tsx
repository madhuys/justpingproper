'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function LogoutFAB() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      // Clear any onboarding data
      localStorage.removeItem('onboarding_complete');
      localStorage.removeItem('onboarding_company');
      localStorage.removeItem('onboarding_company_details');
      localStorage.removeItem('onboarding_admin');
      localStorage.removeItem('onboarding_team');
      localStorage.removeItem('welcome_skipped');
      
      // Logout will handle the routing
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-red-500 hover:bg-red-600 text-white z-50"
      size="icon"
      title="Logout (for testing)"
    >
      <LogOut className="h-5 w-5" />
    </Button>
  );
}