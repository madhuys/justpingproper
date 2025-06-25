import { Button } from '@/components/ui/button';
import { StepIndicator } from '@/components/atoms/StepIndicator';
import { ProgressBar } from '@/components/atoms/ProgressBar';

interface StepHeaderProps {
  currentStep: number;
  totalSteps: number;
  onSkip?: () => void;
  showSkip?: boolean;
}

export function StepHeader({ currentStep, totalSteps, onSkip, showSkip = false }: StepHeaderProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
        {showSkip && onSkip && (
          <Button variant="ghost" size="sm" onClick={onSkip} className="absolute right-0">
            Skip for now
          </Button>
        )}
      </div>
      <ProgressBar value={progress} variant="onboarding" />
    </div>
  );
}