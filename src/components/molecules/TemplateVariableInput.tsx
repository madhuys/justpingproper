'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import templatesStrings from '@/data/strings/templates.json';

interface TemplateVariableInputProps {
  variables: string[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export default function TemplateVariableInput({
  variables,
  values,
  onChange
}: TemplateVariableInputProps) {
  const [testDataRows, setTestDataRows] = React.useState([0]);

  const handleValueChange = (variable: string, value: string, rowIndex: number = 0) => {
    const key = rowIndex === 0 ? variable : `${variable}_row${rowIndex}`;
    onChange({
      ...values,
      [key]: value
    });
  };

  const addTestDataRow = () => {
    setTestDataRows([...testDataRows, testDataRows.length]);
  };

  const removeTestDataRow = (index: number) => {
    if (testDataRows.length > 1) {
      setTestDataRows(testDataRows.filter(i => i !== index));
      // Clean up values for removed row
      const newValues = { ...values };
      variables.forEach(variable => {
        delete newValues[`${variable}_row${index}`];
      });
      onChange(newValues);
    }
  };

  if (variables.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {templatesStrings.templates.builder.preview.variables.title}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={addTestDataRow}
        >
          <Plus className="h-4 w-4 mr-1" />
          {templatesStrings.templates.builder.preview.variables.addRow}
        </Button>
      </div>
      
      <div className="space-y-4">
        {testDataRows.map((rowIndex, idx) => (
          <div key={rowIndex} className="space-y-3 pb-3 border-b last:border-0">
            {idx > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Test Data Set {idx + 1}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTestDataRow(rowIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {variables.map((variable) => {
              const num = variable.match(/\d+/)?.[0] || '1';
              const key = rowIndex === 0 ? variable : `${variable}_row${rowIndex}`;
              
              return (
                <div key={`${variable}-${rowIndex}`}>
                  <Label className="text-sm">
                    {templatesStrings.templates.builder.preview.variables.placeholder.replace('{{num}}', num)}
                  </Label>
                  <Input
                    value={values[key] || ''}
                    onChange={(e) => handleValueChange(variable, e.target.value, rowIndex)}
                    placeholder={`Enter value for ${variable}`}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
}