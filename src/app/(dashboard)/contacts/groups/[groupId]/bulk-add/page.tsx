'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/atoms/Loader';
import { PageHeader } from '@/components/atoms/PageHeader';
import { StepIndicator } from '@/components/molecules/StepIndicator';
import { BulkImportUpload } from '@/components/organisms/BulkImportUpload';
import { BulkImportMapping } from '@/components/organisms/BulkImportMapping';
import { BulkImportProgress } from '@/components/organisms/BulkImportProgress';
import { Maximize2, Minimize2 } from 'lucide-react';
import contactsStrings from '@/data/strings/contacts.json';
import { useContacts } from '@/hooks/useContacts';
import { useUIPreferences } from '@/hooks/useUIPreferences';
import toast from 'react-hot-toast';

interface Field {
  id: string;
  label: string;
  type: string;
  validation: string;
  required: boolean;
}

interface GroupSchema {
  id: string;
  name: string;
  fields: Field[];
}

export default function BulkAddContactsPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  const strings = contactsStrings;
  const { preferences, updateContentExpanded, loading: prefsLoading } = useUIPreferences();
  const {
    loading: contactsLoading,
    state,
    setBulkAddStep,
    setBulkAddFile,
    setBulkAddFileData,
    updateFieldMapping,
    setBulkAddMappingSearch,
    setBulkAddPreviewRows,
    setBulkAddMappingErrors,
    updateBulkAddImportProgress,
    setBulkAddImportStatus
  } = useContacts();
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [groupSchema, setGroupSchema] = useState<GroupSchema | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const steps = [
    { id: 'upload', label: strings.bulkAdd.steps.upload },
    { id: 'mapping', label: strings.bulkAdd.steps.mapping },
    { id: 'import', label: strings.bulkAdd.steps.import }
  ];

  useEffect(() => {
    setMounted(true);
    fetchGroupSchema();
  }, [groupId]);

  useEffect(() => {
    if (!prefsLoading && preferences.contentExpanded !== undefined) {
      setIsExpanded(preferences.contentExpanded);
    }
  }, [preferences.contentExpanded, prefsLoading]);

  const fetchGroupSchema = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockSchema: GroupSchema = {
        id: groupId,
        name: 'VIP_Customers',
        fields: [
          {
            id: '1',
            label: 'First Name',
            type: 'text',
            validation: 'none',
            required: true
          },
          {
            id: '2',
            label: 'Email',
            type: 'email',
            validation: 'validEmail',
            required: true
          },
          {
            id: '3',
            label: 'Employee ID',
            type: 'number',
            validation: 'digits5to10',
            required: false
          }
        ]
      };
      
      setGroupSchema(mockSchema);
      
      const mappings = [
        {
          groupFieldId: 'countryCode',
          groupFieldLabel: 'Country Code',
          mappedColumn: null,
          required: true
        },
        {
          groupFieldId: 'phoneNumber',
          groupFieldLabel: 'Phone Number',
          mappedColumn: null,
          required: true
        },
        ...mockSchema.fields.map(field => ({
          groupFieldId: field.id,
          groupFieldLabel: field.label,
          mappedColumn: null,
          required: field.required
        }))
      ];
      
      setBulkAddFileData([], []);
    } catch (error) {
      toast.error('Failed to load group schema');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setBulkAddFile(file);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockHeaders = ['Name', 'Email Address', 'Phone', 'Country', 'Employee Number'];
      const mockData = [
        { 'Name': 'John Doe', 'Email Address': 'john@example.com', 'Phone': '1234567890', 'Country': '+1', 'Employee Number': '12345' },
        { 'Name': 'Jane Smith', 'Email Address': 'jane@example.com', 'Phone': '0987654321', 'Country': '+44', 'Employee Number': '67890' },
        { 'Name': 'Bob Johnson', 'Email Address': 'invalid-email', 'Phone': '5555555555', 'Country': '+91', 'Employee Number': 'ABC' },
      ];
      
      setBulkAddFileData(mockHeaders, mockData);
      autoMapColumns(mockHeaders);
    } catch (error) {
      toast.error('Failed to parse file');
      setBulkAddFile(null);
    }
  };

  const autoMapColumns = (headers: string[]) => {
    state.bulkAdd.fieldMappings.forEach(mapping => {
      const fieldLabel = mapping.groupFieldLabel.toLowerCase();
      let bestMatch: string | null = null;
      let bestScore = 0;
      
      headers.forEach(header => {
        const headerLower = header.toLowerCase();
        let score = 0;
        
        if (headerLower === fieldLabel) {
          score = 100;
        } else if (headerLower.includes(fieldLabel) || fieldLabel.includes(headerLower)) {
          score = 50;
        } else if (
          (fieldLabel.includes('phone') && headerLower.includes('phone')) ||
          (fieldLabel.includes('email') && headerLower.includes('email')) ||
          (fieldLabel.includes('country') && headerLower.includes('country')) ||
          (fieldLabel.includes('name') && headerLower.includes('name'))
        ) {
          score = 75;
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = header;
        }
      });
      
      if (bestScore > 40) {
        updateFieldMapping(mapping.groupFieldId, bestMatch);
      }
    });
  };

  const handleSimulate = () => {
    const errors: string[] = [];
    const preview: any[] = [];
    
    const unmappedRequired = state.bulkAdd.fieldMappings
      .filter(m => m.required && !m.mappedColumn)
      .map(m => m.groupFieldLabel);
    
    if (unmappedRequired.length > 0) {
      errors.push(strings.bulkAdd.mapping.errors.required.replace('{fields}', unmappedRequired.join(', ')));
    }
    
    state.bulkAdd.fileData.slice(0, 5).forEach((row, index) => {
      const rowErrors: string[] = [];
      const mappedData: Record<string, any> = {};
      
      state.bulkAdd.fieldMappings.forEach(mapping => {
        if (mapping.mappedColumn) {
          const value = row[mapping.mappedColumn];
          mappedData[mapping.groupFieldLabel] = value;
          
          const field = groupSchema?.fields.find(f => f.id === mapping.groupFieldId);
          if (field) {
            if (field.type === 'email' && value && !value.includes('@')) {
              rowErrors.push(`Invalid email in ${field.label}`);
            }
            if (field.type === 'number' && value && isNaN(value)) {
              rowErrors.push(`Invalid number in ${field.label}`);
            }
          }
        }
      });
      
      preview.push({
        rowNumber: index + 1,
        data: mappedData,
        errors: rowErrors
      });
    });
    
    setBulkAddMappingErrors(errors);
    setBulkAddPreviewRows(preview);
  };

  const handleImport = async () => {
    setBulkAddImportStatus('importing');
    setBulkAddStep('import');
    
    const total = state.bulkAdd.fileData.length;
    updateBulkAddImportProgress({
      current: 0,
      total,
      imported: 0,
      skipped: 0,
      errors: 0
    });
    
    for (let i = 0; i < total; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const success = Math.random() > 0.1;
      const duplicate = Math.random() > 0.9;
      
      updateBulkAddImportProgress({
        current: i + 1,
        imported: state.bulkAdd.importProgress.imported + (success && !duplicate ? 1 : 0),
        skipped: state.bulkAdd.importProgress.skipped + (duplicate ? 1 : 0),
        errors: state.bulkAdd.importProgress.errors + (!success ? 1 : 0)
      });
    }
    
    setBulkAddImportStatus('completed');
    toast.success(
      strings.bulkAdd.import.success
        .replace('{imported}', state.bulkAdd.importProgress.imported.toString())
        .replace('{skipped}', state.bulkAdd.importProgress.skipped.toString())
    );
  };

  const handleDownloadTemplate = () => {
    const headers = ['Country Code', 'Phone Number'];
    groupSchema?.fields.forEach(field => {
      headers.push(field.label);
    });
    
    const csv = headers.join(',') + '\n' + '+1,1234567890,John,john@example.com,12345';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${groupSchema?.name}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canProceedToImport = state.bulkAdd.fieldMappings
    .filter(m => m.required)
    .every(m => m.mappedColumn !== null);

  if (!mounted || loading || contactsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex justify-center ${isExpanded ? '' : 'max-w-[1600px] mx-auto'} relative`}>
      <div className="absolute top-8 right-8 z-20">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-card shadow-lg border border-border hover:bg-accent"
          onClick={() => {
            const newExpanded = !isExpanded;
            setIsExpanded(newExpanded);
            updateContentExpanded(newExpanded);
          }}
          title={isExpanded ? "Collapse to default width" : "Expand to full width"}
        >
          {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="flex flex-col gap-6 p-8 w-full">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{strings.breadcrumbs.home}</span>
          <span>/</span>
          <button 
            onClick={() => router.push('/contacts')}
            className="hover:text-foreground"
          >
            {strings.breadcrumbs.contacts}
          </button>
          <span>/</span>
          <button 
            onClick={() => router.push(`/contacts/groups/${groupId}`)}
            className="hover:text-foreground"
          >
            {groupSchema?.name}
          </button>
          <span>/</span>
          <span className="text-foreground">{strings.breadcrumbs.bulkAdd}</span>
        </div>

        <PageHeader
          title={strings.bulkAdd.title.replace('{groupName}', groupSchema?.name || '')}
          description={strings.bulkAdd.description}
        />

        <StepIndicator steps={steps} currentStep={state.bulkAdd.currentStep} className="mb-6" />

        {state.bulkAdd.currentStep === 'upload' && (
          <BulkImportUpload
            uploadedFile={state.bulkAdd.uploadedFile}
            fileRowCount={state.bulkAdd.fileData.length}
            onFileSelect={handleFileSelect}
            onDownloadTemplate={handleDownloadTemplate}
            onNext={() => setBulkAddStep('mapping')}
            onCancel={() => router.push(`/contacts/groups/${groupId}`)}
          />
        )}

        {state.bulkAdd.currentStep === 'mapping' && (
          <BulkImportMapping
            fieldMappings={state.bulkAdd.fieldMappings}
            fileHeaders={state.bulkAdd.fileHeaders}
            mappingSearch={state.bulkAdd.mappingSearch}
            mappingErrors={state.bulkAdd.mappingErrors}
            previewRows={state.bulkAdd.previewRows}
            canProceedToImport={canProceedToImport}
            onMappingChange={updateFieldMapping}
            onMappingSearchChange={setBulkAddMappingSearch}
            onSimulate={handleSimulate}
            onBack={() => setBulkAddStep('upload')}
            onCancel={() => router.push(`/contacts/groups/${groupId}`)}
            onImport={handleImport}
          />
        )}

        {state.bulkAdd.currentStep === 'import' && (
          <BulkImportProgress
            importStatus={state.bulkAdd.importStatus}
            importProgress={state.bulkAdd.importProgress}
            onViewContacts={() => router.push(`/contacts/groups/${groupId}`)}
            onDownloadLog={() => {}}
            onImportMore={() => {
              setBulkAddStep('upload');
              setBulkAddFile(null);
              setBulkAddImportStatus('idle');
            }}
          />
        )}
      </div>
    </div>
  );
}