'use client';

import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  href: string;
  badge?: string | number;
  onClick?: () => void;
  className?: string;
  color?: string;
}

export function ActionCard({ 
  icon: Icon, 
  title, 
  subtitle, 
  href, 
  badge,
  onClick,
  className,
  color 
}: ActionCardProps) {
  const [isClicked, setIsClicked] = useState(false);
  
  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);
    
    if (onClick) {
      onClick();
    } else {
      window.location.href = href;
    }
  };

  return (
    <Card 
      className={cn(
        "relative group cursor-pointer transition-all duration-300",
        "hover:scale-105",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "h-[180px] p-6 flex flex-col items-center justify-center text-center gap-2",
        "bg-card/60 backdrop-blur-sm border-border/50",
        "overflow-hidden",
        isClicked && "animate-pulse scale-95",
        className
      )}
      style={{
        boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)'
      }}
      onClick={handleClick}
      tabIndex={0}
      role="link"
      aria-label={`Navigate to ${title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Gradient accent overlay */}
      <div 
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
          "bg-gradient-to-br",
          color || "from-blue-500 to-purple-500"
        )}
        aria-hidden="true"
      />
      
      {/* Shimmer effect on hover */}
      <div 
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          "bg-gradient-to-r from-transparent via-white/10 to-transparent",
          "group-hover:animate-shimmer"
        )}
        style={{
          backgroundSize: '200% 100%',
        }}
        aria-hidden="true"
      />
      
      {/* Bottom gradient border */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 h-1",
          "bg-gradient-to-r",
          color || "from-blue-500 to-purple-500"
        )}
        aria-hidden="true"
      />
      {badge !== undefined && (
        <Badge 
          variant="default" 
          className="absolute top-2 right-2"
        >
          {badge}
        </Badge>
      )}
      
      <div className="mb-2 relative z-10">
        <Icon className={cn(
          "h-12 w-12 transition-transform duration-300 group-hover:scale-110",
          "text-foreground/70 group-hover:text-foreground"
        )} />
      </div>
      
      <div className="space-y-1 relative z-10">
        <h3 className="text-base font-semibold">
          {title}
        </h3>
        
        {subtitle && (
          <p className="text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
}