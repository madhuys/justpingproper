'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ImageViewerProps {
  url: string;
  alt: string;
  zoom?: number;
}

export function ImageViewer({ url, alt, zoom = 100 }: ImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };
  
  if (hasError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load image</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full w-full flex items-center justify-center overflow-auto bg-checkered">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      
      <div
        className="transition-transform duration-200"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'center'
        }}
      >
        {/* Mock image for demo */}
        <div className="bg-gray-200 rounded-lg p-8" style={{ width: '600px', height: '400px' }}>
          <div className="h-full flex items-center justify-center bg-white rounded">
            <div className="text-center">
              <svg
                className="mx-auto h-24 w-24 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-4 text-sm text-gray-500">{alt}</p>
            </div>
          </div>
        </div>
        
        {/* Real implementation would show actual image */}
        <img
          src={url}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className="max-w-none hidden"
        />
      </div>
      
      <style jsx>{`
        .bg-checkered {
          background-image: 
            linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </div>
  );
}