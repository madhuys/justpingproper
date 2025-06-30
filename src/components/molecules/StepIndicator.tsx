import React from 'react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: string;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className={cn("flex items-center justify-center gap-8", className)}>
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={cn(
            "flex items-center gap-3",
            currentStepIndex === index ? "text-primary" : "text-muted-foreground"
          )}
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            currentStepIndex === index ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            {index + 1}
          </div>
          <span className="font-medium">{step.label}</span>
        </div>
      ))}
    </div>
  );
}