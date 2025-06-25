'use client';

import React from 'react';
import { FileListRow } from './FileListRow';
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

interface FileListViewProps {
  files: FileItem[];
  onFileClick: (fileId: string) => void;
}

export function FileListView({ files, onFileClick }: FileListViewProps) {
  return (
    <div className="p-4">
      <div className="bg-background rounded-lg border">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-3 bg-muted border-b text-sm font-medium">
          <div className="col-span-6">{fileManagementStrings.explorer.list.columns.name}</div>
          <div className="col-span-2">Owner</div>
          <div className="col-span-2">{fileManagementStrings.explorer.list.columns.modified}</div>
          <div className="col-span-2 text-right">{fileManagementStrings.explorer.list.columns.size}</div>
        </div>
        
        {/* Table Body */}
        <div>
          {files.map((file) => (
            <FileListRow
              key={file.id}
              file={file}
              onClick={() => onFileClick(file.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}