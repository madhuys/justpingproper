'use client';

import React from 'react';
import { Check, AlertCircle, Link2Off } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Integration, IntegrationStatus } from '@/lib/integrations/types';
import { getIntegrationIcon, formatLastSync } from '@/lib/integrations/utils';
import integrationsStrings from '@/data/strings/integrations.json';

interface IntegrationCardProps {
  integration: Integration;
  status: IntegrationStatus;
  lastSync?: Date;
  onClick: () => void;
}

export function IntegrationCard({ 
  integration, 
  status,
  lastSync,
  onClick 
}: IntegrationCardProps) {
  const Icon = getIntegrationIcon(integration.icon);
  
  // Get status display properties
  const getStatusDisplay = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Check,
          text: integrationsStrings.card.status.connected,
          className: 'text-green-600 bg-green-50 dark:bg-green-900/20',
          iconClassName: 'text-green-600'
        };
      case 'action_required':
        return {
          icon: AlertCircle,
          text: integrationsStrings.card.status.action_required,
          className: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
          iconClassName: 'text-amber-600'
        };
      default:
        return {
          icon: Link2Off,
          text: integrationsStrings.card.status.not_connected,
          className: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20',
          iconClassName: 'text-gray-600'
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  return (
    <Card 
      className={cn(
        "relative group cursor-pointer transition-all duration-300",
        "hover:scale-105 hover:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "min-h-[280px] p-6 flex flex-col",
        "bg-card/60 backdrop-blur-sm border-border/50",
        "overflow-hidden",
        integration.comingSoon && "opacity-75"
      )}
      onClick={!integration.comingSoon ? onClick : undefined}
      tabIndex={!integration.comingSoon ? 0 : -1}
      role="button"
      aria-label={`${status === 'connected' ? 'Manage' : 'Connect'} ${integration.name}`}
      onKeyDown={(e) => {
        if (!integration.comingSoon && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Gradient accent overlay */}
      <div 
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
          "bg-gradient-to-br",
          integration.color || "from-gray-500 to-gray-600"
        )}
        aria-hidden="true"
      />
      
      {/* Bottom gradient border */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 h-1",
          "bg-gradient-to-r",
          integration.color || "from-gray-500 to-gray-600"
        )}
        aria-hidden="true"
      />

      {/* Coming Soon Badge */}
      {integration.comingSoon && (
        <Badge 
          variant="secondary" 
          className="absolute top-4 right-4"
        >
          {integrationsStrings.card.labels.coming_soon}
        </Badge>
      )}

      {/* MCP Badge */}
      {integration.mcpSupported && !integration.comingSoon && (
        <Badge 
          variant="outline" 
          className="absolute top-4 right-4 border-green-600 text-green-600"
        >
          ✓ {integrationsStrings.card.labels.mcp_supported}
        </Badge>
      )}

      {/* Icon and Name */}
      <div className="mb-4">
        <Icon className={cn(
          "h-12 w-12 mb-3 transition-transform duration-300 group-hover:scale-110",
          "text-foreground/70 group-hover:text-foreground"
        )} />
        <h3 className="text-lg font-semibold">{integration.name}</h3>
      </div>

      {/* Ideal For */}
      <div className="mb-4 flex-1">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">{integrationsStrings.card.labels.ideal_for}</span> {integration.idealFor}
        </p>
      </div>

      {/* Cost Details */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">{integrationsStrings.card.labels.cost}</span> {integration.cost}
        </p>
      </div>

      {/* Status and Action */}
      <div className="mt-auto space-y-3">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge className={cn("gap-1", statusDisplay.className)} variant="secondary">
            <StatusIcon className="h-3 w-3" />
            {statusDisplay.text}
          </Badge>
          {status === 'connected' && lastSync && (
            <span className="text-xs text-muted-foreground">
              {integrationsStrings.card.labels.last_sync} {formatLastSync(lastSync)}
            </span>
          )}
        </div>

        {/* Action Button */}
        {!integration.comingSoon && (
          <Button 
            variant={status === 'connected' ? 'outline' : 'default'}
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            {status === 'connected' 
              ? integrationsStrings.card.actions.manage 
              : integrationsStrings.card.actions.connect
            }
          </Button>
        )}
      </div>
    </Card>
  );
}