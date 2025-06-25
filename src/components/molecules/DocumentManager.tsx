'use client';

import React from 'react';
import { FormField } from '@/components/molecules/FormField';
import { FileUploadArea } from '@/components/molecules/FileUploadArea';
import { FileUploadCard } from '@/components/molecules/FileUploadCard';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import businessProfileStrings from '@/data/strings/businessProfile.json';

interface DocumentManagerProps {
  documents: (string | File)[];
  isEditing: boolean;
  onUpload: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}

export function DocumentManager({ 
  documents, 
  isEditing, 
  onUpload, 
  onRemove 
}: DocumentManagerProps) {
  const strings = businessProfileStrings;

  return (
    <TooltipProvider>
      <FormField 
        label={
          <div className="flex items-center gap-2">
            {strings.fields.documents}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{strings.tooltips.documents}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        }
      >
        {isEditing ? (
          <div className="space-y-3">
            {(documents || []).map((doc, index) => {
              // Handle both File objects and string URLs
              if (doc instanceof File) {
                return (
                  <FileUploadCard
                    key={index}
                    file={doc}
                    onRemove={() => onRemove(index)}
                  />
                );
              } else {
                // For string URLs, display as before
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">{typeof doc === 'string' ? doc.split('/').pop() : doc}</span>
                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      className="text-destructive hover:text-destructive/80 p-1"
                    >
                      ×
                    </button>
                  </div>
                );
              }
            })}
            <FileUploadArea
              onFileSelect={(files) => {
                const fileList = new DataTransfer();
                files.forEach(file => fileList.items.add(file));
                onUpload(fileList.files);
              }}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              multiple={true}
            />
          </div>
        ) : (
          documents && documents.length > 0 ? (
            <div className="space-y-2 mt-2">
              {documents.map((doc, index) => {
                if (doc instanceof File) {
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(doc.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={index} className="p-2 bg-muted rounded">
                      <span className="text-sm">{typeof doc === 'string' ? doc.split('/').pop() : doc}</span>
                    </div>
                  );
                }
              })}
            </div>
          ) : (
            <p className="py-2 text-muted-foreground">{strings.labels.noDocumentsUploaded}</p>
          )
        )}
      </FormField>
    </TooltipProvider>
  );
}