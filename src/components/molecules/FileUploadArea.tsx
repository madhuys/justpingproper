import React from 'react';
import { Upload } from 'lucide-react';

interface FileUploadAreaProps {
  onFileSelect?: (files: File[]) => void;
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

export function FileUploadArea({ 
  onFileSelect,
  onFileUpload, 
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  multiple = true,
  className = ""
}: FileUploadAreaProps) {
  // Generate unique ID for each instance
  const inputId = React.useId();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onFileUpload) {
      onFileUpload(e);
    }
    if (onFileSelect && e.target.files) {
      const files = Array.from(e.target.files);
      onFileSelect(files);
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = '';
  };

  return (
    <div className={`relative ${className}`}>
      <input
        id={inputId}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center pointer-events-none">
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-4" />
        <div>
          <span className="text-sm font-medium text-primary">
            Click to upload documents
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          PDF, DOC, DOCX, JPG, PNG up to 10MB each
        </p>
      </div>
    </div>
  );
}