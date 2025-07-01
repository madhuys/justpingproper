import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WorkflowVariableInput } from '@/components/atoms/WorkflowVariableInput';
import { Plus, X, Variable } from 'lucide-react';
import workflowStrings from '@/data/strings/agents.json';

interface WorkflowVariableCollectionProps {
  variables: string[];
  variableValidations: Record<number, string>;
  onVariablesChange: (variables: string[]) => void;
  onValidationsChange: (validations: Record<number, string>) => void;
  popularVariables?: string[];
}

export function WorkflowVariableCollection({
  variables,
  variableValidations,
  onVariablesChange,
  onValidationsChange,
  popularVariables = workflowStrings.workflow.popularVariables
}: WorkflowVariableCollectionProps) {
  const handleAddVariable = () => {
    onVariablesChange([...variables, '']);
  };

  const handleRemoveVariable = (index: number) => {
    const newVariables = variables.filter((_, i) => i !== index);
    const newValidations = { ...variableValidations };
    
    // Reindex validations
    Object.keys(newValidations).forEach(key => {
      const keyIndex = parseInt(key);
      if (keyIndex === index) {
        delete newValidations[keyIndex];
      } else if (keyIndex > index) {
        newValidations[keyIndex - 1] = newValidations[keyIndex];
        delete newValidations[keyIndex];
      }
    });
    
    onVariablesChange(newVariables);
    onValidationsChange(newValidations);
  };

  const handleUpdateVariable = (index: number, value: string) => {
    const newVariables = [...variables];
    newVariables[index] = value;
    onVariablesChange(newVariables);
  };

  const handleUpdateValidation = (index: number, value: string) => {
    const newValidations = { ...variableValidations };
    if (value) {
      newValidations[index] = value;
    } else {
      delete newValidations[index];
    }
    onValidationsChange(newValidations);
  };

  const handleSelectPopularVariable = (value: string, index: number) => {
    if (value && value !== 'custom') {
      handleUpdateVariable(index, value);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Variable className="h-4 w-4 text-primary" />
          <h3 className="font-medium">Variables to Collect</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddVariable}
          className="h-7"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Variable
        </Button>
      </div>

      <div className="space-y-3">
        {variables.map((variable, index) => (
          <div key={index} className="space-y-2 p-3 border rounded-lg">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label className="text-xs">Variable {index + 1}</Label>
                <div className="flex gap-2">
                  <Select
                    value={variable || 'custom'}
                    onValueChange={(value) => handleSelectPopularVariable(value, index)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom</SelectItem>
                      {popularVariables.map(popVar => (
                        <SelectItem key={popVar} value={popVar}>
                          {popVar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={variable}
                    onChange={(e) => handleUpdateVariable(index, e.target.value)}
                    placeholder="Variable name"
                    className="flex-1"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveVariable(index)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Validation (Optional)</Label>
              <Select
                value={variableValidations[index] || 'none'}
                onValueChange={(value) => handleUpdateValidation(index, value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No validation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone Number</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="alphanumeric">Alphanumeric</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}

        {variables.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No variables added yet. Click "Add Variable" to start collecting data.
          </div>
        )}
      </div>
    </Card>
  );
}