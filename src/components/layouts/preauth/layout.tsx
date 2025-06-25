'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function PreAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const pathname = usePathname();
  
  // Check if we're on login or register pages which need the split layout
  const isMainAuthPage = pathname === '/login' || pathname === '/register';

  if (isMainAuthPage) {
    return (
      <div className="min-h-screen flex relative onboarding-bg">
        {/* Theme toggle in top right */}
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden z-10" style={{ backgroundColor: 'var(--background)' }}>
          
          <div className="relative z-10 max-w-md text-center">
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
              <Image 
                src={theme === 'dark' ? '/logos/logo-dark.png' : '/logos/logo-light.png'} 
                alt="JustPing Logo" 
                width={120} 
                height={120}
                className="h-auto w-32"
              />
            </div>

            {/* Tagline */}
            <h1 className="text-3xl font-bold mb-12 leading-tight" style={{ color: 'var(--foreground)' }}>
              The Future Of Conversational
              <br />
              Recruitment
            </h1>

            {/* Illustration */}
            <div className="relative mx-auto">
              <Image
                src="/images/auth-illustration.png"
                alt="JustPing Illustration"
                width={320}
                height={320}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // For forgot-password and reset-password pages
  return (
    <div className="min-h-screen flex flex-col relative onboarding-bg">
      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Simple header with logo */}
      <header className="p-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <Link href="/">
            <Image
              src={theme === 'dark' ? '/logos/logo-text-dark.png' : '/logos/logo-text-light.png'}
              alt="JustPing"
              width={150}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
        </div>
      </header>

      {/* Main content centered */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  );
}