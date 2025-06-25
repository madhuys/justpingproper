'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { 
  MessageCircle, 
  Instagram, 
  Send, 
  Facebook, 
  Globe, 
  ShoppingBag,
  Layout as LayoutIcon,
  ShoppingCart,
  Box,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageCircle,
  Instagram,
  Send,
  Facebook,
  Globe,
  ShoppingBag,
  Layout: LayoutIcon,
  ShoppingCart,
  Box
};

interface ChannelCardProps {
  channel: {
    id: string;
    name: string;
    icon: string;
    color: string;
    description?: string;
    idealFor?: string;
    cost?: string;
    mcpSupported?: boolean;
    comingSoon?: boolean;
  };
  onClick: () => void;
  tooltip?: string;
  connected?: boolean;
}

export function ChannelCard({ channel, onClick, tooltip, connected }: ChannelCardProps) {
  const Icon = iconMap[channel.icon] || Globe;
  const { resolvedTheme } = useTheme();

  return (
    <TooltipProvider>
      <Card 
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all duration-200",
          "hover:scale-105 hover:shadow-lg",
          connected && "ring-2 ring-green-500",
          channel.comingSoon && "opacity-60"
        )}
        onClick={channel.comingSoon ? undefined : onClick}
      >
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0 relative",
              channel.color
            )}>
              <div className={cn(
                "absolute inset-0 rounded-lg transition-opacity",
                "bg-gray-400/50 dark:opacity-100 opacity-0"
              )} />
              <Icon className="h-6 w-6 text-white relative z-10" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{channel.name}</h3>
                {tooltip && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              {channel.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{channel.description}</p>
              )}
            </div>
            {connected && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              </div>
            )}
          </div>
          
          {(channel.idealFor || channel.cost) && (
            <div className="space-y-1 pt-1 border-t">
              {channel.idealFor && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Ideal for:</span>
                  <span className="text-xs text-muted-foreground flex-1">{channel.idealFor}</span>
                </div>
              )}
              {channel.mcpSupported !== undefined && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-muted-foreground">MCP Supported:</span>
                  <span className="text-xs text-muted-foreground">
                    {channel.mcpSupported ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
              )}
              {channel.cost && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Cost Details:</span>
                  <span className="text-xs text-muted-foreground flex-1">{channel.cost}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </TooltipProvider>
  );
}