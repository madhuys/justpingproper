import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUploadArea } from '@/components/molecules/FileUploadArea';
import { Download, ArrowRight, FileSpreadsheet } from 'lucide-react';
import contactsStrings from '@/data/strings/contacts.json';

interface BulkImportUploadProps {
  uploadedFile: File | null;
  fileRowCount: number;
  onFileSelect: (files: File[]) => void;
  onDownloadTemplate: () => void;
  onNext: () => void;
  onCancel: () => void;
}

export function BulkImportUpload({
  uploadedFile,
  fileRowCount,
  onFileSelect,
  onDownloadTemplate,
  onNext,
  onCancel
}: BulkImportUploadProps) {
  const strings = contactsStrings;

  return (
    <Card className="glassmorphic-modal">
      <CardHeader>
        <CardTitle>{strings.bulkAdd.upload.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FileUploadArea
          onFileSelect={onFileSelect}
          accept=".xlsx,.csv"
          multiple={false}
        />
        
        {uploadedFile && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Badge variant="secondary">{fileRowCount} rows</Badge>
          </div>
        )}
        
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={onDownloadTemplate}
          >
            <Download className="h-4 w-4 mr-2" />
            {strings.bulkAdd.upload.buttons.downloadTemplate}
          </Button>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              onClick={onNext}
              disabled={!uploadedFile}
            >
              {strings.bulkAdd.upload.buttons.next}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}