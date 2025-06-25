'use client';

import React from 'react';
import {
  Folder,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  File,
  FileCode,
  FileArchive
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileIconProps {
  type: 'folder' | 'file';
  mimeType?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-10 w-10'
};

const mimeTypeIcons: Record<string, React.ElementType> = {
  // Documents
  'application/pdf': FileText,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
  'application/msword': FileText,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
  'application/vnd.ms-excel': FileSpreadsheet,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': FileText,
  'application/vnd.ms-powerpoint': FileText,
  
  // Images
  'image/jpeg': FileImage,
  'image/png': FileImage,
  'image/gif': FileImage,
  'image/svg+xml': FileImage,
  'image/webp': FileImage,
  
  // Videos
  'video/mp4': FileVideo,
  'video/quicktime': FileVideo,
  'video/x-msvideo': FileVideo,
  
  // Audio
  'audio/mpeg': FileAudio,
  'audio/wav': FileAudio,
  'audio/ogg': FileAudio,
  
  // Code
  'text/javascript': FileCode,
  'text/typescript': FileCode,
  'text/html': FileCode,
  'text/css': FileCode,
  'application/json': FileCode,
  'text/markdown': FileCode,
  
  // Archives
  'application/zip': FileArchive,
  'application/x-rar-compressed': FileArchive,
  'application/x-7z-compressed': FileArchive,
};

const colorMap: Record<string, string> = {
  // Folders
  folder: 'text-blue-500',
  
  // Documents
  'application/pdf': 'text-red-500',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'text-blue-600',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'text-green-600',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'text-orange-500',
  
  // Images
  'image/jpeg': 'text-purple-500',
  'image/png': 'text-purple-500',
  
  // Media
  'video/mp4': 'text-pink-500',
  'audio/mpeg': 'text-indigo-500',
  
  // Code
  'text/javascript': 'text-yellow-600',
  'application/json': 'text-gray-600',
  
  // Default
  default: 'text-gray-400'
};

export function FileIcon({ type, mimeType, size = 'md', className }: FileIconProps) {
  // Wrapper div forces dark mode colors
  const wrapperClass = "[&>svg]:dark:!text-gray-300";
  
  if (type === 'folder') {
    return (
      <div className={wrapperClass}>
        <Folder 
          className={cn(
            sizeMap[size],
            colorMap.folder,
            className
          )}
        />
      </div>
    );
  }

  const IconComponent = mimeType ? mimeTypeIcons[mimeType] || File : File;
  const color = mimeType ? colorMap[mimeType] || colorMap.default : colorMap.default;
  
  return (
    <div className={wrapperClass}>
      <IconComponent
        className={cn(
          sizeMap[size],
          color,
          className
        )}
      />
    </div>
  );
}