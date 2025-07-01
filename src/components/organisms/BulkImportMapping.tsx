import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import contactsStrings from '@/data/strings/contacts.json';

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

interface BulkImportMappingProps {
  fieldMappings: FieldMapping[];
  fileHeaders: string[];
  mappingSearch: string;
  mappingErrors: string[];
  previewRows: PreviewRow[];
  canProceedToImport: boolean;
  onMappingChange: (fieldId: string, column: string | null) => void;
  onMappingSearchChange: (search: string) => void;
  onSimulate: () => void;
  onBack: () => void;
  onCancel: () => void;
  onImport: () => void;
}

export function BulkImportMapping({
  fieldMappings,
  fileHeaders,
  mappingSearch,
  mappingErrors,
  previewRows,
  canProceedToImport,
  onMappingChange,
  onMappingSearchChange,
  onSimulate,
  onBack,
  onCancel,
  onImport
}: BulkImportMappingProps) {
  const strings = contactsStrings;

  const filteredMappings = fieldMappings.filter(m =>
    m.groupFieldLabel.toLowerCase().includes(mappingSearch.toLowerCase())
  );

  return (
    <>
      <Card className="glassmorphic-modal">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{strings.bulkAdd.mapping.title}</CardTitle>
            <Button
              variant="outline"
              onClick={onSimulate}
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
                onChange={(e) => onMappingSearchChange(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{strings.bulkAdd.mapping.columns.groupField}</TableHead>
                  <TableHead>{strings.bulkAdd.mapping.columns.mappedColumn}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.map(mapping => (
                  <TableRow key={mapping.groupFieldId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{mapping.groupFieldLabel}</span>
                        {mapping.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={mapping.mappedColumn || 'unmapped'}
                        onValueChange={(value) => onMappingChange(mapping.groupFieldId, value === 'unmapped' ? null : value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={strings.bulkAdd.mapping.unmapped} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unmapped">
                            {strings.bulkAdd.mapping.unmapped}
                          </SelectItem>
                          {fileHeaders.map(header => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {mappingErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {mappingErrors.map((error, i) => (
              <p key={i}>{error}</p>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {previewRows.length > 0 && (
        <Card className="glassmorphic-modal">
          <CardHeader>
            <CardTitle className="text-lg">{strings.bulkAdd.mapping.preview.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    {fieldMappings.filter(m => m.mappedColumn).map(mapping => (
                      <TableHead key={mapping.groupFieldId}>
                        {mapping.groupFieldLabel}
                      </TableHead>
                    ))}
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map(row => (
                    <TableRow key={row.rowNumber}>
                      <TableCell>{row.rowNumber}</TableCell>
                      {fieldMappings.filter(m => m.mappedColumn).map(mapping => (
                        <TableCell key={mapping.groupFieldId}>
                          {row.data[mapping.groupFieldLabel] || '-'}
                        </TableCell>
                      ))}
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {strings.bulkAdd.mapping.buttons.back}
        </Button>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            {strings.bulkAdd.mapping.buttons.cancel}
          </Button>
          <Button
            onClick={onImport}
            disabled={!canProceedToImport}
          >
            {strings.bulkAdd.mapping.buttons.import}
          </Button>
        </div>
      </div>
    </>
  );
}