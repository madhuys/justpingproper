import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare } from 'lucide-react';

interface WorkflowPromptInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  showCounter?: boolean;
  className?: string;
}

export function WorkflowPromptInput({
  label,
  value,
  onChange,
  placeholder = 'Enter prompt or question',
  disabled = false,
  rows = 3,
  maxLength,
  showCounter = true,
  className = ''
}: WorkflowPromptInputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          {label}
        </Label>
      )}
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className="resize-none w-full"
        />
        {showCounter && maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {value.length}/{maxLength}
          </div>
        )}
      </div>
    </div>
  );
}