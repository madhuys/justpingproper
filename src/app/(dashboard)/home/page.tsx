'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HomeGrid } from '@/components/molecules/HomeGrid';
import { ConversationsWidgetExpanded } from '@/components/organisms/ConversationsWidgetExpanded';
import { QuickConnectPanel } from '@/components/organisms/QuickConnectPanel';
import { NotificationsPanel } from '@/components/organisms/NotificationsPanel';
import { GlobalSearch } from '@/components/organisms/GlobalSearch';
import { useUIPreferences } from '@/hooks/useUIPreferences';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const router = useRouter();
  const [conversations] = useState({
    total: 142,
    inbound: 65,
    outbound: 77
  });
  
  const [notifications] = useState({
    pendingApprovals: 3,
    failedRuns: 1,
    integrationErrors: 2
  });
  
  const { preferences, updateNotificationsPaneWidth, updateContentExpanded, loading: prefsLoading } = useUIPreferences();
  const [panelWidth, setPanelWidth] = useState(320);
  const [footerHeight, setFooterHeight] = useState(48);
  const [isExpanded, setIsExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  // Set initial width and expanded state from preferences
  useEffect(() => {
    if (!prefsLoading) {
      if (preferences.notificationsPaneWidth) {
        setPanelWidth(preferences.notificationsPaneWidth);
      }
      if (preferences.contentExpanded !== undefined) {
        setIsExpanded(preferences.contentExpanded);
      }
    }
  }, [preferences.notificationsPaneWidth, preferences.contentExpanded, prefsLoading]);

  // Observe footer height
  useEffect(() => {
    const footerElement = document.querySelector('.footer-fixed');
    if (footerElement) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setFooterHeight(entry.contentRect.height);
        }
      });
      resizeObserver.observe(footerElement);
      
      return () => resizeObserver.disconnect();
    }
  }, []);

  useEffect(() => {
    let saveTimeout: NodeJS.Timeout;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      
      // Calculate width from the right edge of the viewport
      const newWidth = window.innerWidth - e.clientX;
      
      if (newWidth >= 320 && newWidth <= 600) {
        setPanelWidth(newWidth);
        
        // Clear existing timeout
        clearTimeout(saveTimeout);
        
        // Save after a short delay to avoid too many API calls
        saveTimeout = setTimeout(() => {
          updateNotificationsPaneWidth(newWidth);
        }, 100);
      }
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        
        // Clear any pending save
        clearTimeout(saveTimeout);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      clearTimeout(saveTimeout);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [panelWidth, updateNotificationsPaneWidth]);

  const handleActionClick = (actionId: string) => {
    // You can add analytics tracking here
    console.log('Action clicked:', actionId);
  };

  return (
    <div className="flex w-full h-full relative">
      {/* Main Content Area */}
      <div 
        className="flex-1 overflow-auto"
        style={{ marginRight: '0px' }}
      >
        <div className={`w-full min-h-full flex justify-center ${isExpanded ? '' : 'max-w-[1600px] mx-auto'} relative`}>
          {/* Expand/Collapse button positioned at top-right of center pane */}
          <div className="absolute top-8 right-8 z-20">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-card shadow-lg border border-border hover:bg-accent"
              onClick={() => {
                const newExpanded = !isExpanded;
                setIsExpanded(newExpanded);
                updateContentExpanded(newExpanded);
              }}
              title={isExpanded ? "Collapse to default width" : "Expand to full width"}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="w-full space-y-6 p-8">
            {/* Global Search Bar */}
            <div className="w-full">
              <GlobalSearch />
            </div>
            
            {/* Expanded Conversations Widget */}
            <ConversationsWidgetExpanded conversations={conversations} />
            
            {/* Main Action Cards */}
            <HomeGrid onActionClick={handleActionClick} />
            
            {/* Quick Connect Panel */}
            <QuickConnectPanel />
          </div>
        </div>
      </div>
      
      {/* Right Notifications Panel - Resizable */}
      <div 
        ref={panelRef}
        className="flex-shrink-0 overflow-hidden relative group flex fixed right-0 bg-card/90 backdrop-blur-xl shadow-2xl border-l border-border z-30"
        style={{ 
          width: `${panelWidth}px`,
          top: 0, // Start from top
          bottom: 0, // Go to bottom
          backgroundColor: 'rgba(var(--card-rgb), 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        {/* Resize handle */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/20 transition-colors z-10"
          onMouseDown={(e) => {
            e.preventDefault();
            isResizing.current = true;
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
          }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
        </div>
        
        <NotificationsPanel notifications={notifications} />
      </div>
    </div>
  );
}