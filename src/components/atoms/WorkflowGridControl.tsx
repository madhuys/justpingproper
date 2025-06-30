import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Grid3x3, Magnet } from 'lucide-react';

interface WorkflowGridControlProps {
  showGrid: boolean;
  snapToGrid: boolean;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  theme: 'light' | 'dark';
}

export function WorkflowGridControl({
  showGrid,
  snapToGrid,
  onToggleGrid,
  onToggleSnap,
  theme
}: WorkflowGridControlProps) {
  const cardStyle = {
    backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(127, 127, 127, 0.2)'
  };

  return (
    <Card className="p-2" style={cardStyle}>
      <div className="flex flex-col gap-2">
        <Button
          size="icon"
          variant={showGrid ? 'default' : 'outline'}
          onClick={onToggleGrid}
          className="h-8 w-8"
          title="Toggle Grid"
        >
          <Grid3x3 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={snapToGrid ? 'default' : 'outline'}
          onClick={onToggleSnap}
          className="h-8 w-8"
          title="Toggle Snap to Grid"
        >
          <Magnet className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}