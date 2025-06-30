import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Hash } from 'lucide-react';

interface WorkflowTokenSliderProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  className?: string;
}

export function WorkflowTokenSlider({
  label,
  value,
  onChange,
  min = 50,
  max = 2000,
  step = 50,
  disabled = false,
  showValue = true,
  className = ''
}: WorkflowTokenSliderProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        {label && (
          <Label className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            {label}
          </Label>
        )}
        {showValue && (
          <span className="text-sm font-medium text-muted-foreground">
            {value} tokens
          </span>
        )}
      </div>
      <Slider
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Short</span>
        <span>Long</span>
      </div>
    </div>
  );
}