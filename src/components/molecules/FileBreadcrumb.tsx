'use client';

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import fileManagementStrings from '@/data/strings/fileManagement.json';

interface FileBreadcrumbProps {
  path: string[];
  onNavigate: (index: number) => void;
}

export function FileBreadcrumb({ path, onNavigate }: FileBreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-1 text-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(-1)}
        className="px-2 py-1 h-auto"
      >
        <Home className="h-4 w-4 mr-1" />
        {fileManagementStrings.explorer.breadcrumb.home}
      </Button>

      {path.map((segment, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(index)}
            className="px-2 py-1 h-auto"
          >
            {segment}
          </Button>
        </React.Fragment>
      ))}
    </nav>
  );
}