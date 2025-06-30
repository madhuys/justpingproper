import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/atoms/EmptyState';
import { GripVertical, Edit, Trash2, Plus, ListChecks } from 'lucide-react';
import contactsStrings from '@/data/strings/contacts.json';

interface CustomField {
  id: string;
  label: string;
  type: string;
  validation: string;
  validationParam?: string;
  required: boolean;
  order: number;
  options?: string[];
}

interface FieldManagerProps {
  customFields: CustomField[];
  onAddField: () => void;
  onEditField: (field: CustomField) => void;
  onDeleteField: (fieldId: string) => void;
}

export function FieldManager({
  customFields,
  onAddField,
  onEditField,
  onDeleteField
}: FieldManagerProps) {
  const strings = contactsStrings;

  return (
    <Card className="glassmorphic-modal">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{strings.fields.customFields.title}</CardTitle>
          <Button onClick={onAddField} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {strings.fields.addField.button}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {customFields.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title={strings.fields.customFields.empty}
            description=""
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{strings.fields.customFields.columns.order}</TableHead>
                  <TableHead>{strings.fields.customFields.columns.label}</TableHead>
                  <TableHead>{strings.fields.customFields.columns.type}</TableHead>
                  <TableHead>{strings.fields.customFields.columns.validation}</TableHead>
                  <TableHead>{strings.fields.customFields.columns.required}</TableHead>
                  <TableHead>{strings.fields.customFields.columns.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customFields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <span className="ml-2">{field.order}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{field.label}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {strings.fields.customFields.types[field.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {strings.fields.customFields.validations[field.validation]}
                      {field.validationParam && (
                        <span className="text-muted-foreground ml-1">
                          ({field.validationParam})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Checkbox checked={field.required} disabled />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditField(field)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteField(field.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}