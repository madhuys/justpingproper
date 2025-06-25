'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ReactNode } from 'react';

interface AuthFormProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  error?: string;
}

export function AuthForm({ title, subtitle, children, error }: AuthFormProps) {
  return (
    <Card className="container border-0">
      <CardHeader className="space-y-1 p-0 pb-8">
        <CardTitle className="text-3xl font-bold text-center">{title}</CardTitle>
        <CardDescription className="text-center">
          {subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md mb-6">
            {error}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}