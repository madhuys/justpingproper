'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useContent } from '@/hooks/useContent';

interface ChatFABProps {
  onClickAction: () => void;
}

export function ChatFAB({ onClickAction }: ChatFABProps) {
  const { resolvedTheme } = useTheme();
  const { content } = useContent('home');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={onClickAction}
      className="transition-all hover:scale-110 drop-shadow-2xl"
      aria-label={content?.help?.liveChat || 'Live Chat'}
    >
      <Image
        src={resolvedTheme === 'dark' ? '/logos/logo-dark.png' : '/logos/logo-light.png'}
        alt="JustPing"
        width={56}
        height={56}
        className="object-contain"
        style={{
          filter: 'drop-shadow(0 0 10px rgba(var(--primary-rgb), 0.4)) drop-shadow(0 0 20px rgba(var(--primary-rgb), 0.3))'
        }}
      />
    </button>
  );
}