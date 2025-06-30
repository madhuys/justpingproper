import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface WorkflowZoomControlProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  theme: 'light' | 'dark';
}

export function WorkflowZoomControl({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitView,
  theme
}: WorkflowZoomControlProps) {
  const cardStyle = {
    backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(127, 127, 127, 0.2)'
  };

  return (
    <>
      <Card className="p-2" style={cardStyle}>
        <div className="flex flex-col gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={onZoomIn}
            className="h-8 w-8"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={onZoomOut}
            className="h-8 w-8"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={onFitView}
            className="h-8 w-8"
            title="Fit to View"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>
      <Card className="p-2" style={cardStyle}>
        <div className="text-xs text-center font-mono">
          {Math.round(zoom * 100)}%
        </div>
      </Card>
    </>
  );
}