'use client';

import React from 'react';
import { format } from 'date-fns';
import { FileIcon } from '@/components/atoms/FileIcon';
import { Card, CardContent } from '@/components/ui/card';

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  mimeType?: string;
  size?: number;
  modifiedAt: string;
  path: string;
}

interface FileInfoProps {
  file: FileItem;
}

// Helper to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export function FileInfo({ file }: FileInfoProps) {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-4">
          <FileIcon
            type={file.type}
            mimeType={file.mimeType}
            size="lg"
            className="h-16 w-16"
          />
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">{file.name}</h3>
            <p className="text-sm text-muted-foreground">{file.path}</p>
          </div>
          
          <div className="w-full space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span>{file.mimeType || 'Unknown'}</span>
            </div>
            
            {file.size && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size:</span>
                <span>{formatFileSize(file.size)}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modified:</span>
              <span>{format(new Date(file.modifiedAt), 'PPp')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}