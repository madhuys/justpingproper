'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileUploadArea } from '@/components/molecules/FileUploadArea';
import { Loader } from '@/components/atoms/Loader';
import { EmptyState } from '@/components/atoms/EmptyState';
import { 
  Upload, 
  Download, 
  Search,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  ArrowLeft,
  ArrowRight,
  FileDown,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import contactsStrings from '@/data/strings/contacts.json';
import toast from 'react-hot-toast';
import { useUIPreferences } from '@/hooks/useUIPreferences';

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

interface FieldMapping {
  groupFieldId: string;
  groupFieldLabel: string;
  mappedColumn: string | null;
  required: boolean;
}

interface PreviewRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
}

type Step = 'upload' | 'mapping' | 'import';

export default function BulkAddContactsPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  const strings = contactsStrings;
  const { preferences, updateContentExpanded, loading: prefsLoading } = useUIPreferences();
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [isExpanded, setIsExpanded] = useState(false);
  const [groupSchema, setGroupSchema] = useState<GroupSchema | null>(null);
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileData, setFileData] = useState<any[]>([]);
  
  // Mapping state
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [mappingSearch, setMappingSearch] = useState('');
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [mappingErrors, setMappingErrors] = useState<string[]>([]);
  
  // Import state
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    imported: 0,
    skipped: 0,
    errors: 0
  });
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'completed'>('idle');

  useEffect(() => {
    setMounted(true);
    fetchGroupSchema();
  }, [groupId]);

  // Set initial expanded state from preferences
  useEffect(() => {
    if (!prefsLoading) {
      if (preferences.contentExpanded !== undefined) {
        setIsExpanded(preferences.contentExpanded);
      }
    }
  }, [preferences.contentExpanded, prefsLoading]);

  const fetchGroupSchema = async () => {
    try {
      setLoading(true);
      // Simulate API call
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
      
      // Initialize field mappings
      const mappings: FieldMapping[] = [
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
      setFieldMappings(mappings);
    } catch (error) {
      toast.error('Failed to load group schema');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setUploadedFile(file);
    
    // Parse file to get headers
    try {
      // Simulate file parsing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock headers and data
      const mockHeaders = ['Name', 'Email Address', 'Phone', 'Country', 'Employee Number'];
      const mockData = [
        { 'Name': 'John Doe', 'Email Address': 'john@example.com', 'Phone': '1234567890', 'Country': '+1', 'Employee Number': '12345' },
        { 'Name': 'Jane Smith', 'Email Address': 'jane@example.com', 'Phone': '0987654321', 'Country': '+44', 'Employee Number': '67890' },
        { 'Name': 'Bob Johnson', 'Email Address': 'invalid-email', 'Phone': '5555555555', 'Country': '+91', 'Employee Number': 'ABC' },
      ];
      
      setFileHeaders(mockHeaders);
      setFileData(mockData);
      
      // Auto-map columns based on similarity
      autoMapColumns(mockHeaders);
    } catch (error) {
      toast.error('Failed to parse file');
      setUploadedFile(null);
    }
  };

  const autoMapColumns = (headers: string[]) => {
    const updatedMappings = fieldMappings.map(mapping => {
      // Find best match for this field
      const fieldLabel = mapping.groupFieldLabel.toLowerCase();
      let bestMatch: string | null = null;
      let bestScore = 0;
      
      headers.forEach(header => {
        const headerLower = header.toLowerCase();
        let score = 0;
        
        // Exact match
        if (headerLower === fieldLabel) {
          score = 100;
        }
        // Contains match
        else if (headerLower.includes(fieldLabel) || fieldLabel.includes(headerLower)) {
          score = 50;
        }
        // Special cases
        else if (
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
      
      return {
        ...mapping,
        mappedColumn: bestScore > 40 ? bestMatch : null
      };
    });
    
    setFieldMappings(updatedMappings);
  };

  const handleMappingChange = (fieldId: string, column: string | null) => {
    setFieldMappings(prev => prev.map(m => 
      m.groupFieldId === fieldId ? { ...m, mappedColumn: column } : m
    ));
  };

  const handleSimulate = () => {
    const errors: string[] = [];
    const preview: PreviewRow[] = [];
    
    // Check required field mappings
    const unmappedRequired = fieldMappings
      .filter(m => m.required && !m.mappedColumn)
      .map(m => m.groupFieldLabel);
    
    if (unmappedRequired.length > 0) {
      errors.push(strings.bulkAdd.mapping.errors.required.replace('{fields}', unmappedRequired.join(', ')));
    }
    
    // Generate preview rows with validation
    fileData.slice(0, 5).forEach((row, index) => {
      const rowErrors: string[] = [];
      const mappedData: Record<string, any> = {};
      
      fieldMappings.forEach(mapping => {
        if (mapping.mappedColumn) {
          const value = row[mapping.mappedColumn];
          mappedData[mapping.groupFieldLabel] = value;
          
          // Validate based on field type
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
    
    setMappingErrors(errors);
    setPreviewRows(preview);
  };

  const handleImport = async () => {
    setImportStatus('importing');
    setCurrentStep('import');
    
    const total = fileData.length;
    setImportProgress({
      current: 0,
      total,
      imported: 0,
      skipped: 0,
      errors: 0
    });
    
    // Simulate import process
    for (let i = 0; i < total; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const success = Math.random() > 0.1; // 90% success rate
      const duplicate = Math.random() > 0.9; // 10% duplicates
      
      setImportProgress(prev => ({
        ...prev,
        current: i + 1,
        imported: prev.imported + (success && !duplicate ? 1 : 0),
        skipped: prev.skipped + (duplicate ? 1 : 0),
        errors: prev.errors + (!success ? 1 : 0)
      }));
    }
    
    setImportStatus('completed');
    toast.success(
      strings.bulkAdd.import.success
        .replace('{imported}', importProgress.imported.toString())
        .replace('{skipped}', importProgress.skipped.toString())
    );
  };

  const handleDownloadTemplate = () => {
    // Generate template CSV
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

  const filteredMappings = fieldMappings.filter(m =>
    m.groupFieldLabel.toLowerCase().includes(mappingSearch.toLowerCase())
  );

  const canProceedToImport = fieldMappings
    .filter(m => m.required)
    .every(m => m.mappedColumn !== null);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex justify-center ${isExpanded ? '' : 'max-w-[1600px] mx-auto'} relative`}>
      {/* Expand/Collapse button positioned at top-right of center pane */}
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
        {/* Breadcrumbs */}
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

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {strings.bulkAdd.title.replace('{groupName}', groupSchema?.name || '')}
        </h1>
        <p className="text-muted-foreground mt-1">{strings.bulkAdd.description}</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-8 mb-6">
        {(['upload', 'mapping', 'import'] as Step[]).map((step, index) => (
          <div
            key={step}
            className={cn(
              "flex items-center gap-3",
              currentStep === step ? "text-primary" : "text-muted-foreground"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              currentStep === step ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              {index + 1}
            </div>
            <span className="font-medium">{strings.bulkAdd.steps[step]}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>{strings.bulkAdd.upload.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FileUploadArea
              onFileSelect={handleFileSelect}
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
                <Badge variant="secondary">{fileData.length} rows</Badge>
              </div>
            )}
            
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                {strings.bulkAdd.upload.buttons.downloadTemplate}
              </Button>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/contacts/groups/${groupId}`)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setCurrentStep('mapping')}
                  disabled={!uploadedFile}
                >
                  {strings.bulkAdd.upload.buttons.next}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'mapping' && (
        <>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{strings.bulkAdd.mapping.title}</CardTitle>
                <Button
                  variant="outline"
                  onClick={handleSimulate}
                >
                  {strings.bulkAdd.mapping.simulate}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {strings.bulkAdd.mapping.description}
              </p>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    className="pl-10"
                    placeholder={strings.bulkAdd.mapping.search}
                    value={mappingSearch}
                    onChange={(e) => setMappingSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="p-4 text-left font-medium">
                        {strings.bulkAdd.mapping.columns.groupField}
                      </th>
                      <th className="p-4 text-left font-medium">
                        {strings.bulkAdd.mapping.columns.mappedColumn}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMappings.map(mapping => (
                      <tr key={mapping.groupFieldId} className="border-b">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{mapping.groupFieldLabel}</span>
                            {mapping.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {mapping.groupFieldId === 'countryCode' || mapping.groupFieldId === 'phoneNumber' ? (
                            <Select
                              value={mapping.mappedColumn || ''}
                              onValueChange={(value) => handleMappingChange(mapping.groupFieldId, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={strings.bulkAdd.mapping.unmapped} />
                              </SelectTrigger>
                              <SelectContent>
                                {fileHeaders.map(header => (
                                  <SelectItem key={header} value={header}>
                                    {header}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Select
                              value={mapping.mappedColumn || ''}
                              onValueChange={(value) => handleMappingChange(mapping.groupFieldId, value || null)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={strings.bulkAdd.mapping.unmapped} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">
                                  {strings.bulkAdd.mapping.unmapped}
                                </SelectItem>
                                {fileHeaders.map(header => (
                                  <SelectItem key={header} value={header}>
                                    {header}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Errors */}
          {mappingErrors.length > 0 && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {mappingErrors.map((error, i) => (
                      <p key={i} className="text-sm text-destructive">{error}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {previewRows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{strings.bulkAdd.mapping.preview.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="p-2 text-left">Row</th>
                        {fieldMappings.filter(m => m.mappedColumn).map(mapping => (
                          <th key={mapping.groupFieldId} className="p-2 text-left">
                            {mapping.groupFieldLabel}
                          </th>
                        ))}
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map(row => (
                        <tr key={row.rowNumber} className="border-b">
                          <td className="p-2">{row.rowNumber}</td>
                          {fieldMappings.filter(m => m.mappedColumn).map(mapping => (
                            <td key={mapping.groupFieldId} className="p-2">
                              {row.data[mapping.groupFieldLabel] || '-'}
                            </td>
                          ))}
                          <td className="p-2">
                            {row.errors.length > 0 ? (
                              <div className="flex items-center gap-2 text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-xs">{row.errors[0]}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs">Valid</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('upload')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {strings.bulkAdd.mapping.buttons.back}
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/contacts/groups/${groupId}`)}
              >
                {strings.bulkAdd.mapping.buttons.cancel}
              </Button>
              <Button
                onClick={handleImport}
                disabled={!canProceedToImport}
              >
                {strings.bulkAdd.mapping.buttons.import}
              </Button>
            </div>
          </div>
        </>
      )}

      {currentStep === 'import' && (
        <Card>
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
                    onClick={() => router.push(`/contacts/groups/${groupId}`)}
                  >
                    {strings.bulkAdd.import.actions.viewContacts}
                  </Button>
                  <Button
                    variant="outline"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    {strings.bulkAdd.import.actions.downloadLog}
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentStep('upload');
                      setUploadedFile(null);
                      setImportStatus('idle');
                    }}
                  >
                    Import More
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}