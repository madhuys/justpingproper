import { clsx } from 'clsx';

/**
 * Shared focus styles for all form elements
 * Uses glassmorphic principles with project colors
 */
export const focusStyles = clsx(
  // Base styles
  'transition-all duration-200',
  
  // Default border color
  'border-border',
  'dark:border-border',
  
  // Remove default outline
  'outline-none',
  
  // Focus visible states - glassmorphic with 60% opacity
  'focus-visible:border-[#1E3A8A]/60',
  'focus-visible:shadow-lg',
  'focus-visible:shadow-[#1E3A8A]/20',
  'focus-visible:ring-2',
  'focus-visible:ring-[#1E3A8A]/30',
  
  // Dark mode focus - use border color variable
  'dark:focus-visible:border-border/60',
  'dark:focus-visible:shadow-border/20',
  'dark:focus-visible:ring-border/30',
  
  // Invalid state
  'aria-invalid:border-destructive',
  'aria-invalid:focus-visible:border-destructive',
  'aria-invalid:focus-visible:shadow-destructive/20',
  'aria-invalid:focus-visible:ring-destructive/30'
);

/**
 * Glassmorphic background styles for form elements
 */
export const glassmorphicInputStyles = clsx(
  'bg-background/50',
  'backdrop-blur-sm',
  'hover:bg-background/70',
  'dark:bg-background/20',
  'dark:hover:bg-background/30'
);