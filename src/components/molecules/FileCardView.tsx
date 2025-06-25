'use client';

import React from 'react';
import { FileCard } from './FileCard';
import { Slider } from '@/components/ui/slider';
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

interface FileCardViewProps {
  files: FileItem[];
  onFileClick: (fileId: string) => void;
  cardSize?: number;
  onCardSizeChange?: (size: number) => void;
  showSizeSlider?: boolean;
}

export function FileCardView({ 
  files, 
  onFileClick, 
  cardSize = 1,
  onCardSizeChange,
  showSizeSlider = false 
}: FileCardViewProps) {
  // Map cardSize (0-2) to size prop
  const sizeMap: ('sm' | 'md' | 'lg')[] = ['sm', 'md', 'lg'];
  const size = sizeMap[Math.floor(cardSize)];
  
  // Dynamic grid configuration based on card size
  const gridConfig = {
    sm: {
      gap: "gap-4"
    },
    md: {
      gap: "gap-4"
    },
    lg: {
      gap: "gap-5"
    }
  };
  
  return (
    <div className="space-y-4">
      {showSizeSlider && (
        <div className="flex items-center gap-4 px-1">
          <span className="text-sm text-muted-foreground">Size:</span>
          <Slider
            value={[cardSize]}
            onValueChange={(value) => onCardSizeChange?.(value[0])}
            min={0}
            max={2}
            step={1}
            className="w-32"
          />
        </div>
      )}
      <div className="p-6">
        <div 
          className={cn("grid", gridConfig[size].gap)}
          style={{ 
            gridTemplateColumns: 'repeat(auto-fill, minmax(212px, 232px))',
            justifyContent: 'start'
          }}
        >
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onClick={() => onFileClick(file.id)}
              size={size}
            />
          ))}
        </div>
      </div>
    </div>
  );
}