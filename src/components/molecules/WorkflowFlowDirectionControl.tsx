import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowUpDown, ArrowLeftRight, Home } from 'lucide-react';
import agentsStrings from '@/data/strings/agents.json';

interface WorkflowFlowDirectionControlProps {
  flowDirection: 'TB' | 'LR';
  onDirectionChange: (direction: 'TB' | 'LR') => void;
  onReturnToStart: () => void;
  theme: 'light' | 'dark';
}

export function WorkflowFlowDirectionControl({
  flowDirection,
  onDirectionChange,
  onReturnToStart,
  theme
}: WorkflowFlowDirectionControlProps) {
  const cardStyle = {
    backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(127, 127, 127, 0.2)'
  };

  return (
    <>
      <Card className="p-2" style={cardStyle}>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={flowDirection === 'TB' ? 'default' : 'outline'}
            onClick={() => onDirectionChange('TB')}
            className="h-8"
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {agentsStrings.workflow.controls.flowDirection.topBottom}
          </Button>
          <Button
            size="sm"
            variant={flowDirection === 'LR' ? 'default' : 'outline'}
            onClick={() => onDirectionChange('LR')}
            className="h-8"
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            {agentsStrings.workflow.controls.flowDirection.leftRight}
          </Button>
        </div>
      </Card>
      <Card className="p-2" style={cardStyle}>
        <Button
          size="sm"
          variant="outline"
          onClick={onReturnToStart}
          className="h-8 w-full"
        >
          <Home className="h-4 w-4 mr-2" />
          {agentsStrings.workflow.controls.returnToStart}
        </Button>
      </Card>
    </>
  );
}