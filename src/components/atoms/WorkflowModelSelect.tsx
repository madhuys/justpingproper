import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Bot } from 'lucide-react';
import aiModelsData from '@/data/aiModels.json';

interface WorkflowModelSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function WorkflowModelSelect({
  label,
  value,
  onChange,
  disabled = false,
  className = ''
}: WorkflowModelSelectProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          {label}
        </Label>
      )}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select AI model" />
        </SelectTrigger>
        <SelectContent>
          {aiModelsData.models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex items-center gap-2">
                <span>{model.name}</span>
                {model.isDefault && (
                  <span className="text-xs text-muted-foreground">(Default)</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}