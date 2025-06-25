'use client';

import React from 'react';
import { FileX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'dashed';
}

export function EmptyState({ 
  icon: Icon,
  title = "No data found",
  description = "There's nothing to show here yet.",
  action,
  className,
  variant = 'default'
}: EmptyStateProps) {
  const baseStyles = variant === 'dashed' 
    ? 'text-center py-8 border-2 border-dashed rounded-lg'
    : 'flex flex-col items-center justify-center py-12 px-4 text-center';

  return (
    <div className={cn(baseStyles, className)}>
      {Icon && variant === 'default' && (
        <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
      )}
      <h3 className={cn(
        variant === 'dashed' ? 'text-muted-foreground' : 'text-lg font-medium text-foreground mb-1'
      )}>
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
