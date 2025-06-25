'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  max?: number;
  min?: number;
  step?: number;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ 
    className, 
    value, 
    defaultValue = [0], 
    onValueChange, 
    max = 100, 
    min = 0, 
    step = 1,
    disabled = false,
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const [isDragging, setIsDragging] = React.useState(false);
    const currentValue = value || internalValue;
    const percentage = ((currentValue[0] - min) / (max - min)) * 100;
    
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const handleMove = (event: MouseEvent) => {
        const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
        const newValue = min + (x / rect.width) * (max - min);
        const steppedValue = Math.round(newValue / step) * step;
        const clampedValue = Math.max(min, Math.min(max, steppedValue));
        
        const newValues = [clampedValue];
        setInternalValue(newValues);
        onValueChange?.(newValues);
      };
      
      const handleUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };
      
      setIsDragging(true);
      handleMove(e.nativeEvent);
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex w-full touch-none select-none items-center',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onMouseDown={handleMouseDown}
        {...props}
      >
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div 
            className="absolute h-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div
          className={cn(
            "absolute block h-5 w-5 rounded-full border-2 border-primary bg-white dark:bg-gray-800 shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            isDragging ? "cursor-grabbing scale-110" : "cursor-grab"
          )}
          style={{ 
            left: `calc(${percentage}% - 10px)`,
            pointerEvents: disabled ? 'none' : 'auto'
          }}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };