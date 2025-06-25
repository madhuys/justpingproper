'use client';

import React from 'react';
import { FileThumbnail } from './FileThumbnail';

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  mimeType?: string;
  size?: number;
  modifiedAt: string;
  thumbnailUrl?: string;
}

interface FileThumbnailViewProps {
  files: FileItem[];
  onFileClick: (fileId: string) => void;
}

export function FileThumbnailView({ files, onFileClick }: FileThumbnailViewProps) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
        {files.map((file) => (
          <FileThumbnail
            key={file.id}
            file={file}
            onClick={() => onFileClick(file.id)}
          />
        ))}
      </div>
    </div>
  );
}