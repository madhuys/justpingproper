'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Header } from '@/components/navigation/Header';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Footer } from '@/components/navigation/Footer';
import { StatusBar } from '@/components/organisms/StatusBar';
import { useKnowledgebase } from '@/hooks/useKnowledgebase';
import { OmniChatFAB } from '@/components/organisms/OmniChatFAB';

export default function PostAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const { buildStatus, cancelBuild } = useKnowledgebase();
  const [footerHeight, setFooterHeight] = useState(48); // Default 3rem = 48px
  const [viewportHeight, setViewportHeight] = useState(0);
  const [totalHeight, setTotalHeight] = useState(0);
  
  // Adjust footer height when StatusBar is visible
  const effectiveFooterHeight = buildStatus.isBuilding ? footerHeight + 64 : footerHeight; // 64px for StatusBar

  useEffect(() => {
    // Get viewport height
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };
    
    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
    };
  }, []);

  useEffect(() => {
    let mainContent: HTMLElement | null = null;
    let footerObserver: ResizeObserver | null = null;

    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      const scrolled = target.scrollTop;
      const parallaxBg = document.querySelector('.parallax-bg') as HTMLElement;
      const parallaxOverlay = document.querySelector('.parallax-overlay') as HTMLElement;
      
      if (parallaxBg && parallaxOverlay) {
        // Scale effect - zoom out as we scroll (starting from 1.0 like onboarding)
        const scale = 1.0 + (scrolled * 0.0002);
        parallaxBg.style.transform = `scale(${scale})`;
        
        // Opacity effect - darken overlay as we scroll
        const isDark = resolvedTheme === 'dark';
        const baseOpacity = isDark ? 0.8 : 0.6;
        const scrollOpacity = scrolled * 0.0005;
        const opacity = Math.min(0.9, baseOpacity + scrollOpacity);
        const overlayColor = isDark ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`;
        parallaxOverlay.style.backgroundColor = overlayColor;
      }
    };

    // Set initial background image based on theme
    const updateBackground = () => {
      const parallaxBg = document.querySelector('.parallax-bg') as HTMLElement;
      const parallaxOverlay = document.querySelector('.parallax-overlay') as HTMLElement;
      const isDark = resolvedTheme === 'dark';
      
      if (parallaxBg) {
        const bgImage = isDark ? '/images/dark-bg.webp' : '/images/light-bg.webp';
        parallaxBg.style.backgroundImage = `url("${bgImage}")`;
      }
      
      if (parallaxOverlay) {
        const baseOpacity = isDark ? 0.8 : 0.6;
        const overlayColor = isDark ? `rgba(0, 0, 0, ${baseOpacity})` : `rgba(255, 255, 255, ${baseOpacity})`;
        parallaxOverlay.style.backgroundColor = overlayColor;
      }
    };

    // Wait for DOM to be ready
    const initializeParallax = () => {
      mainContent = document.querySelector('main > div');
      const footerElement = document.querySelector('.footer-fixed');
      
      // Check if there's a nested scrollable element (like in home page)
      const nestedScrollable = document.querySelector('.flex-1.overflow-auto') as HTMLElement | null;
      if (nestedScrollable) {
        mainContent = nestedScrollable;
      }
      
      if (mainContent) {
        mainContent.addEventListener('scroll', handleScroll);
        updateBackground();
      } else {
        // Retry after a short delay if element not found
        setTimeout(initializeParallax, 100);
      }

      // Observe footer height changes
      if (footerElement && ResizeObserver) {
        footerObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const newHeight = entry.contentRect.height;
            setFooterHeight(newHeight);
          }
        });
        footerObserver.observe(footerElement);
      }
    };

    initializeParallax();

    return () => {
      if (mainContent) {
        mainContent.removeEventListener('scroll', handleScroll);
      }
      if (footerObserver) {
        footerObserver.disconnect();
      }
    };
  }, [resolvedTheme]); // Add resolvedTheme as dependency to trigger background update

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
      
      {/* Fixed Sidebar - positioned below header */}
      <div className="fixed left-0 top-16 bottom-0 z-40 w-64 bg-background border-r">
        <Sidebar />
      </div>
      
      {/* Main content area - properly positioned between header, sidebar, and footer */}
      <main 
        className="fixed bg-background"
        style={{ 
          top: '64px',    // Header height (4rem = 64px)
          left: '256px',  // Sidebar width (16rem = 256px)
          right: 0,
          bottom: `${effectiveFooterHeight}px`, // Footer height + StatusBar height
          zIndex: 10,
          overflow: 'hidden'
        }}
      >
        {/* Content with scrollable container */}
        <div className="w-full h-full overflow-auto">
          {children}
        </div>
      </main>
      
      {/* Fixed Footer - anchored to absolute bottom */}
      <div className="fixed left-0 right-0 bottom-0 z-50 bg-background border-t footer-fixed">
        <Footer />
      </div>
      
      
      {/* StatusBar - appears above footer when building */}
      <StatusBar buildStatus={buildStatus} onCancel={cancelBuild} />
      
      {/* OmniChat FAB - appears on all pages */}
      <OmniChatFAB />
    </div>
  );
}