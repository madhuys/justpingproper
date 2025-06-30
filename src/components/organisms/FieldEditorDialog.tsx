import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FormField } from '@/components/molecules/FormField';
import { Plus, Trash2 } from 'lucide-react';
import contactsStrings from '@/data/strings/contacts.json';
import fieldTypesData from '@/data/contactFieldTypes.json';

interface FieldFormData {
  label: string;
  type: string;
  validation: string;
  validationParam: string;
  required: boolean;
  options: string[];
}

interface FieldEditorDialogProps {
  isOpen: boolean;
  isEditing: boolean;
  fieldForm: FieldFormData;
  labelSuggestions: string[];
  showSuggestions: boolean;
  onClose: () => void;
  onSave: () => void;
  onFieldFormChange: (updates: Partial<FieldFormData>) => void;
  onLabelInput: (value: string) => void;
  onSuggestionSelect: (suggestion: string) => void;
}

export function FieldEditorDialog({
  isOpen,
  isEditing,
  fieldForm,
  labelSuggestions,
  showSuggestions,
  onClose,
  onSave,
  onFieldFormChange,
  onLabelInput,
  onSuggestionSelect
}: FieldEditorDialogProps) {
  const strings = contactsStrings;

  const getFieldTypeData = (type: string) => {
    return fieldTypesData.fieldTypes.find(ft => ft.value === type);
  };

  const getValidationsForType = (type: string) => {
    const fieldType = getFieldTypeData(type);
    if (!fieldType) return [];
    
    return fieldType.validations.map(v => {
      const rule = fieldTypesData.validationRules[v];
      return { value: v, label: rule.label };
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md glassmorphic-modal">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Field' : strings.fields.addField.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <FormField label={strings.fields.addField.labelLabel} required>
            <div className="relative">
              <Input
                value={fieldForm.label}
                onChange={(e) => onLabelInput(e.target.value)}
                placeholder={strings.fields.addField.labelPlaceholder}
              />
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-10">
                  {labelSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      onClick={() => onSuggestionSelect(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          <FormField label={strings.fields.addField.typeLabel}>
            <Select 
              value={fieldForm.type} 
              onValueChange={(value) => onFieldFormChange({ type: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypesData.fieldTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={strings.fields.addField.validationLabel}>
            <Select 
              value={fieldForm.validation} 
              onValueChange={(value) => onFieldFormChange({ validation: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getValidationsForType(fieldForm.type).map(validation => (
                  <SelectItem key={validation.value} value={validation.value}>
                    {validation.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {fieldTypesData.validationRules[fieldForm.validation]?.requiresParam && (
            <FormField 
              label={fieldTypesData.validationRules[fieldForm.validation].paramLabel}
            >
              <Input
                value={fieldForm.validationParam}
                onChange={(e) => onFieldFormChange({ validationParam: e.target.value })}
                placeholder="Enter value"
              />
            </FormField>
          )}

          {fieldForm.type === 'dropdown' && (
            <FormField label="Options">
              <div className="space-y-2">
                {fieldForm.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...fieldForm.options];
                        newOptions[index] = e.target.value;
                        onFieldFormChange({ options: newOptions });
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        onFieldFormChange({ 
                          options: fieldForm.options.filter((_, i) => i !== index) 
                        });
                      }}
                      disabled={fieldForm.options.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFieldFormChange({ 
                    options: [...fieldForm.options, ''] 
                  })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </FormField>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="required"
              checked={fieldForm.required}
              onCheckedChange={(checked) => onFieldFormChange({ required: checked as boolean })}
            />
            <label htmlFor="required" className="text-sm font-medium">
              {strings.fields.addField.requiredLabel}
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {strings.fields.addField.cancelButton}
          </Button>
          <Button onClick={onSave}>
            {strings.fields.addField.saveButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}