import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  className?: string;
  variant?: 'default' | 'onboarding';
}

export function ProgressBar({ value, className, variant = 'default' }: ProgressBarProps) {
  const variantStyles = {
    default: 'progress-default',
    onboarding: 'progress-onboarding'
  };

  return (
    <Progress 
      value={value} 
      className={cn(
        'w-full h-2',
        variantStyles[variant],
        className
      )} 
    />
  );
}