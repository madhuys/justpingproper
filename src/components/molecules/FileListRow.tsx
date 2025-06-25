'use client';

import React from 'react';
import { format } from 'date-fns';
import { FileIcon } from '@/components/atoms/FileIcon';
import { MoreVertical, Users } from 'lucide-react';
import fileManagementStrings from '@/data/strings/fileManagement.json';

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  mimeType?: string;
  size?: number;
  modifiedAt: string;
  thumbnailUrl?: string;
}

interface FileListRowProps {
  file: FileItem;
  onClick: () => void;
}

// Helper to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Helper to get file type display name
const getFileTypeDisplay = (file: FileItem): string => {
  if (file.type === 'folder') {
    return fileManagementStrings.explorer.fileTypes.folder;
  }

  const mimeTypeMap: Record<string, keyof typeof fileManagementStrings.explorer.fileTypes> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/gif': 'image',
    'video/mp4': 'video',
    'audio/mpeg': 'audio',
    'text/plain': 'text',
    'text/markdown': 'text'
  };

  const typeKey = file.mimeType ? mimeTypeMap[file.mimeType] : 'other';
  return fileManagementStrings.explorer.fileTypes[typeKey || 'other'];
};

export function FileListRow({ file, onClick }: FileListRowProps) {
  return (
    <div
      onClick={onClick}
      className="grid grid-cols-12 gap-4 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 transition-colors"
    >
      <div className="col-span-6 flex items-center space-x-3">
        <FileIcon type={file.type} mimeType={file.mimeType} size="sm" />
        <span className="text-sm font-medium truncate">{file.name}</span>
      </div>
      <div className="col-span-2 text-sm text-muted-foreground">You</div>
      <div className="col-span-2 text-sm text-muted-foreground">
        {format(new Date(file.modifiedAt), 'MMM d, yyyy')}
      </div>
      <div className="col-span-2 text-sm text-muted-foreground text-right">
        {file.type === 'folder' ? '—' : file.size ? formatFileSize(file.size) : '—'}
      </div>
    </div>
  );
}