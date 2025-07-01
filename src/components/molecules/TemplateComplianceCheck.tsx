'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import templatesStrings from '@/data/strings/templates.json';
import { cn } from '@/lib/utils';

interface TemplateComplianceCheckProps {
  issues: string[];
  onValidate: () => boolean;
}

export default function TemplateComplianceCheck({
  issues,
  onValidate
}: TemplateComplianceCheckProps) {
  const [isValidating, setIsValidating] = React.useState(false);

  const handleValidate = () => {
    setIsValidating(true);
    setTimeout(() => {
      onValidate();
      setIsValidating(false);
    }, 500);
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {templatesStrings.templates.builder.compliance.title}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleValidate}
          disabled={isValidating}
        >
          <RefreshCw className={cn("h-4 w-4 mr-1", isValidating && "animate-spin")} />
          Validate
        </Button>
      </div>

      {issues.length === 0 ? (
        <Alert className="border-green-500/20 bg-green-500/10 dark:border-green-500/20 dark:bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            {templatesStrings.templates.builder.compliance.passed}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-2">
          <Alert className="border-red-500/20 bg-red-500/10 dark:border-red-500/20 dark:bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              {templatesStrings.templates.builder.compliance.failed.replace('{{count}}', issues.length.toString())}
            </AlertDescription>
          </Alert>
          
          <ul className="space-y-1 mt-3">
            {issues.map((issue, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-red-500 dark:text-red-400 mt-0.5">•</span>
                <span className="text-muted-foreground">{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}