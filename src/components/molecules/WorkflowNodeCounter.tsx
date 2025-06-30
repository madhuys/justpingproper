import React from 'react';
import { Card } from '@/components/ui/card';
import { MessageSquare, FileText, Zap, CheckCircle } from 'lucide-react';

interface WorkflowNodeCounterProps {
  nodeCounts: {
    message: number;
    input: number;
    action: number;
    end: number;
  };
  theme: 'light' | 'dark';
}

export function WorkflowNodeCounter({ nodeCounts, theme }: WorkflowNodeCounterProps) {
  const cardStyle = {
    backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(127, 127, 127, 0.2)'
  };

  return (
    <Card className="p-2" style={cardStyle}>
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3 text-blue-500" />
          <span>{nodeCounts.message}</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3 text-green-500" />
          <span>{nodeCounts.input}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-purple-500" />
          <span>{nodeCounts.action}</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-red-500" />
          <span>{nodeCounts.end}</span>
        </div>
      </div>
    </Card>
  );
}