'use client';

import React, { useState } from 'react';
import { Loader } from '@/components/atoms/Loader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LoadingTestPage() {
  const [showLoader, setShowLoader] = useState(false);

  if (showLoader) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Loading Screen Test</h1>
        <p className="text-muted-foreground mb-6">
          This page allows you to test the loading screen component within the post-auth layout.
          You can see how it looks with the header, sidebar, and footer in place.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => setShowLoader(true)}
            className="w-full"
          >
            Show Loading Screen
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Click the button above to see the loading screen. Refresh the page to return to this test view.
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-3">Loading Screen Features</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Theme-aware logo switching (light/dark)</li>
          <li>• Shimmer animation effect</li>
          <li>• Animated loading dots</li>
          <li>• Hydration mismatch prevention</li>
          <li>• Responsive design</li>
          <li>• Smooth transitions</li>
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-3">Test Instructions</h2>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>1. Click "Show Loading Screen" to see the loader</li>
          <li>2. Test theme switching while loader is visible</li>
          <li>3. Check responsiveness on different screen sizes</li>
          <li>4. Verify animations are smooth</li>
          <li>5. Refresh page to return to this test view</li>
        </ol>
      </Card>
    </div>
  );
}
