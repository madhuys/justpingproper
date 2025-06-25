'use client';

import React from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { FileIcon } from '@/components/atoms/FileIcon';
import { cn } from '@/lib/utils';

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  mimeType?: string;
  size?: number;
  modifiedAt: string;
  thumbnailUrl?: string;
}

interface FileCardProps {
  file: FileItem;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
}

// Helper to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export function FileCard({ file, onClick, size = 'sm' }: FileCardProps) {
  const isImage = file.mimeType?.startsWith('image/');
  
  const sizeClasses = {
    sm: {
      iconSize: 'md' as const,
      textSize: 'text-sm',
      detailSize: 'text-xs'
    },
    md: {
      iconSize: 'lg' as const,
      textSize: 'text-sm',
      detailSize: 'text-xs'
    },
    lg: {
      iconSize: 'xl' as const,
      textSize: 'text-base',
      detailSize: 'text-sm'
    }
  };
  
  const sizeConfig = sizeClasses[size];
  
  return (
    <div onClick={onClick} className="group cursor-pointer">
      <Card className="hover:shadow-md transition-all duration-200 p-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="relative">
            <FileIcon
              type={file.type}
              mimeType={file.mimeType}
              size={sizeConfig.iconSize}
            />
          </div>
          <div className="text-center">
            <p className={cn("font-medium truncate max-w-[150px]", sizeConfig.textSize)} title={file.name}>
              {file.name}
            </p>
            <p className={cn("text-muted-foreground mt-1", sizeConfig.detailSize)}>
              {file.type === 'folder' ? `${Math.floor(Math.random() * 20)} items` : file.size ? formatFileSize(file.size) : ''}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}