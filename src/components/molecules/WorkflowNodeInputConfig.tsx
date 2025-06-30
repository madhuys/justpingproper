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
import { Plus, X, List, ToggleLeft, Type } from 'lucide-react';

interface WorkflowNodeInputConfigProps {
  inputType: 'text' | 'choice' | 'multiselect';
  variable: string;
  choices: string[];
  validation: string;
  onInputTypeChange: (value: 'text' | 'choice' | 'multiselect') => void;
  onVariableChange: (value: string) => void;
  onChoicesChange: (choices: string[]) => void;
  onValidationChange: (value: string) => void;
}

export function WorkflowNodeInputConfig({
  inputType,
  variable,
  choices,
  validation,
  onInputTypeChange,
  onVariableChange,
  onChoicesChange,
  onValidationChange
}: WorkflowNodeInputConfigProps) {
  const handleAddChoice = () => {
    onChoicesChange([...choices, '']);
  };

  const handleRemoveChoice = (index: number) => {
    onChoicesChange(choices.filter((_, i) => i !== index));
  };

  const handleUpdateChoice = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    onChoicesChange(newChoices);
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Input Type</Label>
          <Select value={inputType} onValueChange={onInputTypeChange as any}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Text Input
                </div>
              </SelectItem>
              <SelectItem value="choice">
                <div className="flex items-center gap-2">
                  <ToggleLeft className="h-4 w-4" />
                  Single Choice
                </div>
              </SelectItem>
              <SelectItem value="multiselect">
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Multiple Choice
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <WorkflowVariableInput
          label="Variable Name"
          value={variable}
          onChange={onVariableChange}
          placeholder="e.g., userName, email, preference"
        />

        {inputType === 'text' && (
          <div className="space-y-2">
            <Label>Validation Type</Label>
            <Select value={validation} onValueChange={onValidationChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select validation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone Number</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="time">Time</SelectItem>
                <SelectItem value="alphanumeric">Alphanumeric</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {(inputType === 'choice' || inputType === 'multiselect') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Options</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddChoice}
                className="h-7"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Option
              </Button>
            </div>
            <div className="space-y-2">
              {choices.map((choice, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={choice}
                    onChange={(e) => handleUpdateChoice(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveChoice(index)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {choices.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No options added yet
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}