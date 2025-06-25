'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PdfViewerProps {
  url: string;
  zoom?: number;
}

export function PdfViewer({ url, zoom = 100 }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  
  useEffect(() => {
    let mounted = true;
    
    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Loading PDF from URL:', url);
        
        // For now, let's use a simpler approach with an iframe
        // since PDF.js requires installation
        if (mounted) {
          setIsLoading(false);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('PDF loading error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadPdf();
    
    return () => {
      mounted = false;
    };
  }, [url]);
  
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    
    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: zoom / 100 });
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };
    
    renderPage();
  }, [pdfDoc, currentPage, zoom]);
  
  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(numPages, prev + 1));
  };
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load PDF</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }
  
  // For now, use iframe as PDF.js requires npm installation
  // In production, you would install and use PDF.js properly
  return (
    <div className="relative h-full w-full flex flex-col bg-gray-100">
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <iframe
            src={url}
            className="w-full h-full border-0"
            title="PDF Viewer"
            onLoad={() => setIsLoading(false)}
            onError={() => setError('Failed to load PDF')}
          />
        )}
      </div>
    </div>
  );
}