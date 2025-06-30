'use client';

import React, { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';
import { OmniChatFAB } from '@/components/organisms/OmniChatFAB';

export default function AgentBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Update background image based on theme - same logic as postauth layout
    const parallaxBg = document.querySelector('.parallax-bg') as HTMLElement;
    const parallaxOverlay = document.querySelector('.parallax-overlay') as HTMLElement;
    
    if (parallaxBg && parallaxOverlay) {
      if (resolvedTheme === 'dark') {
        parallaxBg.style.backgroundImage = 'url("/images/dark-bg.webp")';
        parallaxOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      } else {
        parallaxBg.style.backgroundImage = 'url("/images/light-bg.webp")';
        parallaxOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
      }
    }
  }, [resolvedTheme]);

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* Parallax background effect - positioned fixed behind everything */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-75 ease-out parallax-bg"
        style={{
          backgroundImage: 'url("/images/light-bg.webp")',
          transform: 'scale(1.0)',
          zIndex: 1
        }}
      />
      <div 
        className="fixed inset-0 transition-all duration-75 ease-out parallax-overlay"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          zIndex: 2
        }}
      />

      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b">
        <Header />
      </div>
      
      {/* Main content area - properly positioned between header and footer */}
      <main 
        className="fixed bg-background"
        style={{ 
          top: '64px',    // Header height (4rem = 64px)
          left: 0,
          right: 0,
          bottom: '49px', // Footer height (3rem = 48px) + border (1px)
          zIndex: 10,
          overflow: 'hidden'
        }}
      >
        {children}
      </main>
      
      {/* Fixed Footer - anchored to absolute bottom */}
      <div className="fixed left-0 right-0 bottom-0 z-50 bg-background border-t h-12">
        <Footer />
      </div>
      
      {/* OmniChat FAB - appears on all pages */}
      <OmniChatFAB />
    </div>
  );
}