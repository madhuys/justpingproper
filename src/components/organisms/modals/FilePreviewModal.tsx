'use client';

import React, { useState } from 'react';
import { 
  Download, 
  X, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Minimize2,
  Loader2 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PdfViewer } from '@/components/organisms/PdfViewer';
import { OfficeViewer } from '@/components/organisms/OfficeViewer';
import { ImageViewer } from '@/components/organisms/ImageViewer';
import { VideoPlayer } from '@/components/organisms/VideoPlayer';
import { AudioPlayer } from '@/components/organisms/AudioPlayer';
import { ImageGallery } from '@/components/organisms/ImageGallery';
import { FileInfo } from '@/components/molecules/FileInfo';
import fileManagementStrings from '@/data/strings/fileManagement.json';
import toast from 'react-hot-toast';
import { isImageFile, isVideoFile, isAudioFile, isPdfFile, isOfficeFile } from '@/lib/file-utils';

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  mimeType?: string;
  size?: number;
  modifiedAt: string;
  path: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
}

interface FilePreviewModalProps {
  file: FileItem;
  isOpen: boolean;
  onClose: () => void;
}

// Remove static list since we now have utility functions

export function FilePreviewModal({ file, isOpen, onClose }: FilePreviewModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showGallery, setShowGallery] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const canPreview = file.mimeType && (
    isPdfFile(file.mimeType) || 
    isOfficeFile(file.mimeType) || 
    isImageFile(file.mimeType) || 
    isVideoFile(file.mimeType) || 
    isAudioFile(file.mimeType) ||
    file.mimeType.startsWith('text/')
  );
  
  const handleDownload = async () => {
    try {
      // Mock download - in real implementation, this would download from the provider
      const link = document.createElement('a');
      link.href = '#';
      link.download = file.name;
      link.click();
      
      toast.success(fileManagementStrings.success.downloaded);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };
  
  const renderPreview = () => {
    if (!canPreview || !file.mimeType) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <FileInfo file={file} />
          <p className="text-muted-foreground mt-4">
            {fileManagementStrings.modal.preview.errors.unsupported}
          </p>
        </div>
      );
    }
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }
    
    // Handle image gallery overlay
    if (showGallery && isImageFile(file.mimeType)) {
      return (
        <ImageGallery
          images={[{ 
            src: file.downloadUrl || '', 
            caption: file.name 
          }]}
          currentIndex={0}
          onClose={() => setShowGallery(false)}
        />
      );
    }
    
    // Render based on file type
    if (isPdfFile(file.mimeType)) {
      return <PdfViewer url={file.downloadUrl || ''} zoom={zoom} />;
    }
    
    if (isOfficeFile(file.mimeType)) {
      return <OfficeViewer url={file.downloadUrl || ''} type={file.mimeType} />;
    }
    
    if (isImageFile(file.mimeType)) {
      return (
        <div 
          className="flex items-center justify-center h-full cursor-pointer"
          onClick={() => setShowGallery(true)}
        >
          <ImageViewer 
            url={file.thumbnailUrl || file.downloadUrl || ''} 
            alt={file.name} 
            zoom={zoom} 
          />
        </div>
      );
    }
    
    if (isVideoFile(file.mimeType)) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <VideoPlayer
            src={file.downloadUrl || ''}
            title={file.name}
            className="w-full max-w-4xl"
          />
        </div>
      );
    }
    
    if (isAudioFile(file.mimeType)) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <AudioPlayer
            src={file.downloadUrl || ''}
            title={file.name}
            className="w-full max-w-lg"
          />
        </div>
      );
    }
    
    if (file.mimeType.startsWith('text/')) {
      return (
        <div className="p-6 bg-muted rounded-lg h-full overflow-auto">
          <pre className="text-sm whitespace-pre-wrap">
            {/* In a real app, this would fetch and display the actual file content */}
            This is a preview of {file.name}
            
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </pre>
        </div>
      );
    }
    
    return <FileInfo file={file} />;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={isExpanded 
          ? "!w-screen !h-screen !max-w-full !rounded-none flex flex-col p-0 bg-background" 
          : "!w-[85vw] !h-[85vh] !max-w-[85vw] !min-w-[80vw] !min-h-[80vh] flex flex-col p-0 bg-background"
        }
        showCloseButton={false}
      >
        {/* Hidden DialogTitle for accessibility */}
        <DialogTitle className="sr-only">{file.name}</DialogTitle>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="text-lg font-semibold truncate pr-4">{file.name}</h2>
          <div className="flex items-center gap-2">
            {canPreview && file.mimeType && !isVideoFile(file.mimeType) && !isAudioFile(file.mimeType) && !file.mimeType.startsWith('text/') && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  title={fileManagementStrings.modal.preview.actions.zoomOut}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground w-12 text-center">
                  {zoom}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  title={fileManagementStrings.modal.preview.actions.zoomIn}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              {fileManagementStrings.modal.preview.actions.download}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Exit fullscreen" : "Fullscreen"}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Preview Content */}
        <div className="flex-1 overflow-hidden bg-muted/20">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
}