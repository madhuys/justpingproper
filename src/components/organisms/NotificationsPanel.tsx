'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { useContent } from '@/hooks/useContent';
import { useRouter } from 'next/navigation';

interface NotificationsPanelProps {
  notifications: {
    pendingApprovals: number;
    failedRuns: number;
    integrationErrors: number;
  };
}

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  const { content } = useContent('home');
  const router = useRouter();

  const items = [
    {
      id: 'pendingApprovals',
      label: content?.widgets?.notifications?.pendingApprovals || 'Pending Approvals',
      count: notifications.pendingApprovals,
      icon: CheckCircle,
      color: 'text-yellow-600',
      href: '/approvals'
    },
    {
      id: 'failedRuns',
      label: content?.widgets?.notifications?.failedRuns || 'Failed Runs',
      count: notifications.failedRuns,
      icon: XCircle,
      color: 'text-red-600',
      href: '/agents?status=failed'
    },
    {
      id: 'integrationErrors',
      label: content?.widgets?.notifications?.integrationErrors || 'Integration Errors',
      count: notifications.integrationErrors,
      icon: AlertCircle,
      color: 'text-orange-600',
      href: '/settings/integrations?status=error'
    }
  ];

  const totalNotifications = Object.values(notifications).reduce((sum, count) => sum + count, 0);

  return (
    <div className="w-full h-full flex flex-col bg-transparent">
      <div className="w-full border-b border-border/50 bg-card/30">
        <div className="flex items-center justify-between px-4 py-4">
          <h3 className="text-lg font-semibold text-card-foreground">
            {content?.widgets?.notifications?.title || 'Notifications & Alerts'}
          </h3>
          {totalNotifications > 0 && (
            <Badge variant="destructive">{totalNotifications}</Badge>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4">
        <div className="py-4 space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.id}
                className="p-4 hover:bg-accent/80 cursor-pointer transition-all duration-200 bg-card/60 backdrop-blur-sm border border-border/50 hover:border-border/70"
                onClick={() => router.push(item.href)}
                style={{
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${item.count > 0 ? item.color : 'text-muted-foreground'}`} />
                    <span className={item.count === 0 ? 'text-muted-foreground' : ''}>
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.count > 0 && (
                      <Badge variant={item.id === 'pendingApprovals' ? 'secondary' : 'destructive'}>
                        {item.count}
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            );
          })}
          
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={() => router.push('/notifications')}
            >
              {content?.widgets?.notifications?.viewAll || 'View All'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}