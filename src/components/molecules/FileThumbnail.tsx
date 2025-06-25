'use client';

import React, { useState, useEffect } from 'react';
import { FileIcon } from '@/components/atoms/FileIcon';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  mimeType?: string;
  size?: number;
  modifiedAt: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
}

interface FileThumbnailProps {
  file: FileItem;
  onClick: () => void;
}

// Component to render PDF thumbnail
function PdfThumbnail({ file }: { file: FileItem }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Use the downloadUrl which already has the correct public path
  const pdfUrl = file.downloadUrl || file.thumbnailUrl || '';
  
  if (!pdfUrl || hasError) {
    return (
      <FileIcon
        type="file"
        mimeType="application/pdf"
        size="lg"
        className="opacity-50"
      />
    );
  }
  
  return (
    <div className="w-full h-full relative overflow-hidden bg-gray-50 dark:bg-gray-800">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Loader2 className="h-6 w-6 animate-spin opacity-50" />
        </div>
      )}
      <iframe
        src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
        className="w-full h-full border-0"
        style={{
          pointerEvents: 'none'
        }}
        title="PDF Preview"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}

// Component to render video thumbnail
function VideoThumbnail({ url }: { url: string }) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    
    const generateVideoThumbnail = async () => {
      try {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.muted = true;
        
        video.onloadeddata = () => {
          video.currentTime = 1; // Seek to 1 second
        };
        
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const context = canvas.getContext('2d');
          if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            if (mounted) {
              setThumbnail(canvas.toDataURL());
              setIsLoading(false);
            }
          }
          
          // Clean up
          video.remove();
        };
        
        video.onerror = () => {
          console.error('Failed to load video');
          if (mounted) {
            setIsLoading(false);
          }
          video.remove();
        };
        
        video.src = url;
        video.load();
      } catch (error) {
        console.error('Failed to generate video thumbnail:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    generateVideoThumbnail();
    
    return () => {
      mounted = false;
    };
  }, [url]);
  
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin opacity-50" />
      </div>
    );
  }
  
  if (thumbnail) {
    return (
      <img
        src={thumbnail}
        alt="Video preview"
        className="w-full h-full object-cover"
      />
    );
  }
  
  return (
    <FileIcon
      type="file"
      mimeType="video/mp4"
      size="lg"
      className="opacity-50"
    />
  );
}

export function FileThumbnail({ file, onClick }: FileThumbnailProps) {
  const isImage = file.mimeType?.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf';
  const isVideo = file.mimeType?.startsWith('video/');
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "cursor-pointer group",
              "flex flex-col items-center gap-2 p-2",
              "rounded-lg hover:bg-muted transition-colors"
            )}
            onClick={onClick}
          >
            {/* Thumbnail */}
            <div className="w-full aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center">
              {isImage && file.thumbnailUrl ? (
                <img
                  src={file.thumbnailUrl}
                  alt={file.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to icon if image fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : isPdf ? (
                <PdfThumbnail file={file} />
              ) : isVideo && (file.downloadUrl || file.thumbnailUrl) ? (
                <VideoThumbnail url={file.downloadUrl || file.thumbnailUrl || ''} />
              ) : (
                <FileIcon
                  type={file.type}
                  mimeType={file.mimeType}
                  size="lg"
                  className="opacity-50"
                />
              )}
            </div>

            {/* Name */}
            <p className="text-xs text-center w-full truncate px-1">
              {file.name}
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{file.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}