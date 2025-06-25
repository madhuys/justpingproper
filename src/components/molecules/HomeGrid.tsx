'use client';

import React from 'react';
import { ActionCard } from '@/components/atoms/ActionCard';
import { 
  Bot, 
  Users, 
  BookOpen, 
  Layout, 
  BotMessageSquare,
  UsersRound,
  Building2,
  Megaphone,
  Settings
} from 'lucide-react';

interface HomeAction {
  id: string;
  icon: any;
  title: string;
  subtitle?: string;
  href: string;
  badge?: string | number;
  color: string;
}

const homeActions: HomeAction[] = [
  {
    id: 'build-agent',
    icon: Bot,
    title: 'Build an Agent',
    subtitle: 'Create AI-powered agents',
    href: '/agents/new',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'manage-contacts',
    icon: Users,
    title: 'Manage Contacts',
    subtitle: 'Organize your contacts',
    href: '/contacts',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'manage-knowledge',
    icon: BookOpen,
    title: 'Manage Knowledgebases',
    subtitle: 'Build your knowledge hub',
    href: '/knowledgebase',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'browse-templates',
    icon: Layout,
    title: 'Browse Agent Templates',
    subtitle: 'Start with templates',
    href: '/templates',
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'your-agents',
    icon: BotMessageSquare,
    title: 'Your Agents',
    subtitle: 'View and manage agents',
    href: '/agents',
    color: 'from-violet-500 to-purple-500'
  },
  {
    id: 'team-members',
    icon: UsersRound,
    title: 'Team Members',
    subtitle: 'Manage your team',
    href: '/users',
    badge: 2,
    color: 'from-sky-500 to-blue-500'
  },
  {
    id: 'business-profile',
    icon: Building2,
    title: 'Business Profile',
    subtitle: 'Update company info',
    href: '/business-profile',
    color: 'from-teal-500 to-green-500'
  },
  {
    id: 'campaigns',
    icon: Megaphone,
    title: 'Campaigns',
    subtitle: 'Launch & track campaigns',
    href: '/campaigns',
    badge: 3,
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Settings & Integrations',
    subtitle: 'Configure your workspace',
    href: '/settings',
    color: 'from-gray-500 to-gray-600'
  }
];

interface HomeGridProps {
  onActionClick?: (actionId: string) => void;
}

export function HomeGrid({ onActionClick }: HomeGridProps) {
  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold mb-2">
          What would you like to do today?
        </h1>
        <p className="text-muted-foreground">
          Choose an action to get started
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
        {homeActions.map((action) => (
          <ActionCard
            key={action.id}
            icon={action.icon}
            title={action.title}
            subtitle={action.subtitle}
            href={action.href}
            badge={action.badge}
            color={action.color}
            onClick={() => onActionClick?.(action.id)}
          />
        ))}
      </div>
    </div>
  );
}