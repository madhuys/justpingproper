'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Megaphone,
  BarChart3,
  Users,
  FileText,
  Bot,
  Plug,
  Inbox,
  Building,
  CreditCard,
  UserCircle,
  Home,
  BookOpen,
  FolderOpen,
  Send,
  Shield
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [onboardingState, setOnboardingState] = useState<any>(null);
  // const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    setMounted(true);
    fetchOnboardingState();
  }, []);

  const fetchOnboardingState = async () => {
    try {
      const response = await fetch('/api/states/onboarding');
      const data = await response.json();
      setOnboardingState(data);
    } catch (error) {
      console.error('Failed to fetch onboarding state:', error);
    } // finally {
    //   setIsLoading(false);
    // }
  };

  // Remove profile setup section completely
  const navigation = [
    {
      id: 'home',
      title: 'Home',
      href: '/home',
      icon: Home,
    },
    {
      id: 'campaigns',
      title: 'Campaigns',
      href: '/campaigns',
      icon: Megaphone
    },
    {
      id: 'contacts',
      title: 'Contacts',
      href: '/contacts',
      icon: Users
    },
    {
      id: 'agents',
      title: 'Agents',
      href: '/agents',
      icon: Bot
    },
    {
      id: 'publish',
      title: 'Publish',
      href: '/agents/publish',
      icon: Send
    },
    {
      id: 'templates',
      title: 'Templates',
      href: '/templates',
      icon: FileText
    },
    {
      id: 'knowledgebase',
      title: 'Knowledgebase',
      href: '/knowledgebase',
      icon: BookOpen
    },
    {
      id: 'integrations',
      title: 'Integrations',
      href: '/integrations',
      icon: Plug
    },
    {
      id: 'file-manager',
      title: 'File Manager',
      href: '/file-manager',
      icon: FolderOpen
    },
    {
      id: 'team-inbox',
      title: 'Team Inbox',
      href: '/team-inbox',
      icon: Inbox
    },
    {
      id: 'users',
      title: 'Users',
      href: '/users',
      icon: UserCircle
    },
    {
      id: 'business-profile',
      title: 'Business Profile',
      href: '/business-profile',
      icon: Building
    },
    {
      id: 'billing',
      title: 'Billing',
      href: '/billing',
      icon: CreditCard
    }
  ];

  // Use the current theme, falling back to system theme, and default to 'light' for SSR
  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'light';

  // Don't render until onboarding state is loaded to prevent flashing
  // if (isLoading) {
  //   return (
  //     <aside className="w-64 min-h-full shadow-lg sidebar-glass-dark">
  //       <div className="flex h-full flex-col">
  //         <div className="flex-1" />
  //       </div>
  //     </aside>
  //   );
  // }

  return (
    <>
      {/* IMPORTANT: Do NOT change the sidebar color in light mode. It must remain #081491 (blue) as per design requirements. */}
      <aside className={cn(
        "w-64 min-h-full shadow-lg",
        currentTheme === 'light'
          ? "sidebar-glass"
          : "sidebar-glass-dark text-primary-foreground"
      )}>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? currentTheme === 'light' 
                        ? "bg-white text-[#081491]" 
                        : "bg-primary text-primary-foreground"
                      : currentTheme === 'light'
                        ? "text-white hover:bg-white/10"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
    </>
  );
}