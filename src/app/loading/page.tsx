'use client';

import React from 'react';
import { Loader } from '@/components/atoms/Loader';

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader />
    </div>
  );
}