'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  text?: string;
}

export function Loader({ 
  className, 
  size = 'md', 
  showText = true, 
  text = 'Loading' 
}: LoaderProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Animate dots when text is shown
  useEffect(() => {
    if (!showText) return;

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [showText]);

  // Determine the current theme, with a fallback
  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'light';

  // Size configurations
  const sizeConfig = {
    sm: {
      logo: { width: 120, height: 36 },
      textClass: 'text-sm'
    },
    md: {
      logo: { width: 200, height: 60 },
      textClass: 'text-lg'
    },
    lg: {
      logo: { width: 280, height: 84 },
      textClass: 'text-xl'
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="relative">
        {/* Logo with drop shadow glow effect */}
        <div className="relative">
          {/* Light mode logo with blue drop shadow glow */}
          <div className={cn(
            "relative",
            currentTheme === 'dark' ? 'hidden' : 'block'
          )}>
            <Image
              src="/logos/logo-light.png"
              alt="JustPing"
              width={config.logo.width}
              height={config.logo.height}
              className="relative z-10 animate-[drop-shadow-glow_2s_ease-in-out_infinite]"
              priority
            />
          </div>
          
          {/* Dark mode logo with yellow drop shadow glow */}
          <div className={cn(
            "relative",
            currentTheme === 'dark' ? 'block' : 'hidden'
          )}>
            <Image
              src="/logos/logo-dark.png"
              alt="JustPing"
              width={config.logo.width}
              height={config.logo.height}
              className="relative z-10 animate-[drop-shadow-glow-dark_2s_ease-in-out_infinite]"
              priority
            />
          </div>
        </div>
        
        {/* Loading text */}
        {showText && (
          <div className="mt-6 text-center">
            <p className={cn(config.textClass, "text-muted-foreground")}>
              {text}{dots}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
