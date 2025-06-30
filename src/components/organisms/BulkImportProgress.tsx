import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader } from '@/components/atoms/Loader';
import { CheckCircle, FileDown } from 'lucide-react';
import contactsStrings from '@/data/strings/contacts.json';

interface ImportProgress {
  current: number;
  total: number;
  imported: number;
  skipped: number;
  errors: number;
}

interface BulkImportProgressProps {
  importStatus: 'idle' | 'importing' | 'completed';
  importProgress: ImportProgress;
  onViewContacts: () => void;
  onDownloadLog: () => void;
  onImportMore: () => void;
}

export function BulkImportProgress({
  importStatus,
  importProgress,
  onViewContacts,
  onDownloadLog,
  onImportMore
}: BulkImportProgressProps) {
  const strings = contactsStrings;

  return (
    <Card className="glassmorphic-modal">
      <CardContent className="p-8">
        {importStatus === 'importing' && (
          <div className="space-y-6">
            <div className="text-center">
              <Loader />
              <p className="mt-4 text-lg font-medium">
                {strings.bulkAdd.import.progress
                  .replace('{current}', importProgress.current.toString())
                  .replace('{total}', importProgress.total.toString())
                  .replace('{percent}', Math.round((importProgress.current / importProgress.total) * 100).toString())}
              </p>
            </div>
            
            <Progress 
              value={(importProgress.current / importProgress.total) * 100} 
              className="h-2"
            />
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{importProgress.imported}</p>
                <p className="text-sm text-muted-foreground">Imported</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{importProgress.skipped}</p>
                <p className="text-sm text-muted-foreground">Skipped</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{importProgress.errors}</p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>
          </div>
        )}
        
        {importStatus === 'completed' && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Import Completed!</h3>
              <p className="text-muted-foreground">
                {strings.bulkAdd.import.success
                  .replace('{imported}', importProgress.imported.toString())
                  .replace('{skipped}', importProgress.skipped.toString())}
              </p>
            </div>
            
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={onViewContacts}
              >
                {strings.bulkAdd.import.actions.viewContacts}
              </Button>
              <Button
                variant="outline"
                onClick={onDownloadLog}
              >
                <FileDown className="h-4 w-4 mr-2" />
                {strings.bulkAdd.import.actions.downloadLog}
              </Button>
              <Button
                onClick={onImportMore}
              >
                Import More
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}