'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeReady({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state with correct background color
  if (!mounted) {
    return (
      <div 
        className="min-h-screen"
        style={{ 
          backgroundColor: '#050a16' // Default to dark to prevent flash
        }}
      />
    );
  }

  return <>{children}</>;
}