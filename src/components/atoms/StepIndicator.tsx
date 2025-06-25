import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[]; // Optional: step labels
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full text-center animate-fade-in">
        <span className="text-lg font-bold tracking-wide text-muted-foreground">Step </span>
        <span className="text-2xl font-extrabold text-step-accent pulse-grow">{currentStep}</span>
        <span className="text-lg font-bold text-muted-foreground"> of </span>
        <span className="text-2xl font-bold text-foreground">{totalSteps}</span>
      </div>
      {labels && labels[currentStep - 1] && (
        <div className="mt-2 text-sm text-muted-foreground font-medium text-center w-full animate-fade-in">
          {labels[currentStep - 1]}
        </div>
      )}
    </div>
  );
}

