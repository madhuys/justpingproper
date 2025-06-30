import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Thermometer } from 'lucide-react';

interface WorkflowTemperatureSliderProps {
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

export function WorkflowTemperatureSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.1,
  disabled = false,
  showValue = true,
  className = ''
}: WorkflowTemperatureSliderProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        {label && (
          <Label className="flex items-center gap-2">
            <Thermometer className="h-4 w-4" />
            {label}
          </Label>
        )}
        {showValue && (
          <span className="text-sm font-medium text-muted-foreground">
            {value.toFixed(1)}
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
        <span>Precise</span>
        <span>Creative</span>
      </div>
    </div>
  );
}