import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, X } from 'lucide-react';
import agentsStrings from '@/data/strings/agents.json';

interface WorkflowSaveStatusProps {
  saveStatus: string | null;
  hasChanges: boolean;
  onClearStatus: () => void;
  theme: 'light' | 'dark';
}

export function WorkflowSaveStatus({
  saveStatus,
  hasChanges,
  onClearStatus,
  theme
}: WorkflowSaveStatusProps) {
  if (!saveStatus && !hasChanges) return null;

  const cardStyle = {
    backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(127, 127, 127, 0.2)'
  };

  return (
    <Card 
      className="p-3 flex items-center gap-2 shadow-lg animate-in slide-in-from-bottom-5 duration-300"
      style={cardStyle}
    >
      {saveStatus ? (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">{saveStatus}</span>
          <button
            onClick={onClearStatus}
            className="ml-auto hover:bg-accent/20 rounded p-1"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      ) : (
        <>
          <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">{agentsStrings.workflow.controls.unsavedChanges}</span>
        </>
      )}
    </Card>
  );
}