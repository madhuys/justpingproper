import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  Columns,
  Rows,
  GitBranch
} from 'lucide-react';

interface WorkflowAlignmentControlProps {
  onAlignLeft: () => void;
  onAlignCenterHorizontal: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignCenterVertical: () => void;
  onAlignBottom: () => void;
  onDistributeHorizontal: () => void;
  onDistributeVertical: () => void;
  onArrangeHierarchy: () => void;
  theme: 'light' | 'dark';
}

export function WorkflowAlignmentControl({
  onAlignLeft,
  onAlignCenterHorizontal,
  onAlignRight,
  onAlignTop,
  onAlignCenterVertical,
  onAlignBottom,
  onDistributeHorizontal,
  onDistributeVertical,
  onArrangeHierarchy,
  theme
}: WorkflowAlignmentControlProps) {
  const cardStyle = {
    backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(127, 127, 127, 0.2)'
  };

  return (
    <Card className="p-2" style={cardStyle}>
      <div className="flex items-center gap-2">
        <div className="text-xs text-muted-foreground mr-2">Align:</div>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="outline"
            onClick={onAlignLeft}
            className="h-7 w-7"
            title="Align Left"
          >
            <AlignHorizontalJustifyStart className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={onAlignCenterHorizontal}
            className="h-7 w-7"
            title="Align Center Horizontal"
          >
            <AlignHorizontalJustifyCenter className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={onAlignRight}
            className="h-7 w-7"
            title="Align Right"
          >
            <AlignHorizontalJustifyEnd className="h-3 w-3" />
          </Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button
            size="icon"
            variant="outline"
            onClick={onAlignTop}
            className="h-7 w-7"
            title="Align Top"
          >
            <AlignVerticalJustifyStart className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={onAlignCenterVertical}
            className="h-7 w-7"
            title="Align Center Vertical"
          >
            <AlignVerticalJustifyCenter className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={onAlignBottom}
            className="h-7 w-7"
            title="Align Bottom"
          >
            <AlignVerticalJustifyEnd className="h-3 w-3" />
          </Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button
            size="icon"
            variant="outline"
            onClick={onDistributeHorizontal}
            className="h-7 w-7"
            title="Distribute Horizontally"
          >
            <Columns className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={onDistributeVertical}
            className="h-7 w-7"
            title="Distribute Vertically"
          >
            <Rows className="h-3 w-3" />
          </Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button
            size="icon"
            variant="outline"
            onClick={onArrangeHierarchy}
            className="h-7 w-7"
            title="Auto Arrange"
          >
            <GitBranch className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}