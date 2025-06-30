import React from 'react';
import { Card } from '@/components/ui/card';
import { WorkflowModelSelect } from '@/components/atoms/WorkflowModelSelect';
import { WorkflowPromptInput } from '@/components/atoms/WorkflowPromptInput';
import { WorkflowTemperatureSlider } from '@/components/atoms/WorkflowTemperatureSlider';
import { WorkflowTokenSlider } from '@/components/atoms/WorkflowTokenSlider';
import { Sparkles } from 'lucide-react';

interface WorkflowNodeAIConfigProps {
  aiModel: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  onModelChange: (value: string) => void;
  onSystemPromptChange: (value: string) => void;
  onTemperatureChange: (value: number) => void;
  onMaxTokensChange: (value: number) => void;
}

export function WorkflowNodeAIConfig({
  aiModel,
  systemPrompt,
  temperature,
  maxTokens,
  onModelChange,
  onSystemPromptChange,
  onTemperatureChange,
  onMaxTokensChange
}: WorkflowNodeAIConfigProps) {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-medium">AI Configuration</h3>
      </div>

      <WorkflowModelSelect
        label="AI Model"
        value={aiModel}
        onChange={onModelChange}
      />

      <WorkflowPromptInput
        label="System Prompt"
        value={systemPrompt}
        onChange={onSystemPromptChange}
        placeholder="Define how the AI should behave (optional)"
        rows={3}
      />

      <WorkflowTemperatureSlider
        label="Temperature"
        value={temperature}
        onChange={onTemperatureChange}
      />

      <WorkflowTokenSlider
        label="Max Tokens"
        value={maxTokens}
        onChange={onMaxTokensChange}
      />
    </Card>
  );
}