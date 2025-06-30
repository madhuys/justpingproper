import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WorkflowPromptInput } from '@/components/atoms/WorkflowPromptInput';
import { Tag } from 'lucide-react';

interface WorkflowNodeBasicConfigProps {
  nodeLabel: string;
  nodePrompt: string;
  onLabelChange: (value: string) => void;
  onPromptChange: (value: string) => void;
  hasCustomLabel: boolean;
  onCustomLabelChange: (value: boolean) => void;
  nodeType: string;
}

export function WorkflowNodeBasicConfig({
  nodeLabel,
  nodePrompt,
  onLabelChange,
  onPromptChange,
  hasCustomLabel,
  onCustomLabelChange,
  nodeType
}: WorkflowNodeBasicConfigProps) {
  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Node Label
          </Label>
          <Input
            value={nodeLabel}
            onChange={(e) => {
              onLabelChange(e.target.value);
              if (!hasCustomLabel && e.target.value !== nodeLabel) {
                onCustomLabelChange(true);
              }
            }}
            placeholder="Enter node label"
            className="w-full"
          />
          {!hasCustomLabel && nodeType === 'input' && (
            <p className="text-xs text-muted-foreground">
              Label updates automatically based on input type
            </p>
          )}
        </div>

        {nodeType === 'input' && (
          <WorkflowPromptInput
            label="Prompt to User"
            value={nodePrompt}
            onChange={onPromptChange}
            placeholder="What question should we ask the user?"
            rows={2}
          />
        )}

        {nodeType === 'aiAnalyze' && (
          <WorkflowPromptInput
            label="Analysis Prompt"
            value={nodePrompt}
            onChange={onPromptChange}
            placeholder="What should the AI analyze?"
            rows={3}
          />
        )}
      </div>
    </Card>
  );
}