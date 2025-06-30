import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Variable } from 'lucide-react';

interface WorkflowVariableInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showBadge?: boolean;
  className?: string;
}

export function WorkflowVariableInput({
  label,
  value,
  onChange,
  placeholder = 'Enter variable name',
  disabled = false,
  showBadge = true,
  className = ''
}: WorkflowVariableInputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="flex items-center gap-2">
          <Variable className="h-4 w-4" />
          {label}
        </Label>
      )}
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
        />
        {showBadge && value && (
          <Badge variant="secondary" className="font-mono">
            {`{{${value}}}`}
          </Badge>
        )}
      </div>
    </div>
  );
}