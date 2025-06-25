'use client';

import React from 'react';
import { Footer } from '@/components/navigation/Footer';
import { LogoutFAB } from '@/components/atoms/LogoutFab';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden onboarding-bg">
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Theme toggle in top right */}
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Centered content */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-20">
          <div className="w-full max-w-[1280px] mx-auto container-onboarding rounded-xl relative z-30">
            {children}
          </div>
        </main>

        {/* Footer */}
        <div className="relative z-20">
          <Footer />
        </div>
        
        {/* Logout FAB for testing */}
        <div className="relative z-50">
          <LogoutFAB />
        </div>
      </div>
    </div>
  );
}