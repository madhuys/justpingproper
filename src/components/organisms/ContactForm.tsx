import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { FormField } from '@/components/molecules/FormField';
import { Loader } from '@/components/atoms/Loader';
import { Calendar, Mail, Hash, Type, ChevronDown } from 'lucide-react';
import contactsStrings from '@/data/strings/contacts.json';
import countryCodes from '@/data/countryCodes.json';

interface Field {
  id: string;
  label: string;
  type: string;
  validation: string;
  validationParam?: string;
  required: boolean;
  order: number;
  options?: string[];
}

interface ContactFormProps {
  fields: Field[];
  formData: Record<string, any>;
  errors: Record<string, string>;
  saving: boolean;
  onFieldChange: (fieldId: string, value: any) => void;
  onSaveAndClose: () => void;
  onSaveAndAddAnother: () => void;
  onCancel: () => void;
}

export function ContactForm({
  fields,
  formData,
  errors,
  saving,
  onFieldChange,
  onSaveAndClose,
  onSaveAndAddAnother,
  onCancel
}: ContactFormProps) {
  const strings = contactsStrings;

  const renderFieldIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'number':
        return <Hash className="h-4 w-4" />;
      case 'date':
        return <Calendar className="h-4 w-4" />;
      case 'dropdown':
        return <ChevronDown className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  const renderField = (field: Field) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            type={field.type}
            value={formData[field.id] || ''}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
        
      case 'date':
        return (
          <Input
            type="date"
            value={formData[field.id] || ''}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
          />
        );
        
      case 'dropdown':
        return (
          <Select
            value={formData[field.id] || ''}
            onValueChange={(value) => onFieldChange(field.id, value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      default:
        return (
          <Input
            value={formData[field.id] || ''}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <Card className="glassmorphic-modal">
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField 
            label="Country Code" 
            required
            error={errors.countryCode}
          >
            <Combobox
              options={countryCodes.map(cc => ({
                value: cc.code,
                label: `${cc.flag} ${cc.code} ${cc.country}`
              }))}
              value={formData.countryCode}
              onValueChange={(value) => onFieldChange('countryCode', value)}
              placeholder="Select country code"
              searchPlaceholder="Search country..."
            />
          </FormField>
          
          <FormField 
            label="Phone Number" 
            required
            error={errors.phoneNumber}
          >
            <Input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => onFieldChange('phoneNumber', e.target.value)}
              placeholder="Enter phone number"
            />
          </FormField>
          
          {fields.map(field => (
            <FormField 
              key={field.id}
              label={
                <div className="flex items-center gap-2">
                  {renderFieldIcon(field.type)}
                  {field.label}
                </div>
              }
              required={field.required}
              error={errors[field.id]}
            >
              {renderField(field)}
            </FormField>
          ))}
        </div>
        
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={onCancel}
          >
            {strings.addContact.form.cancel}
          </Button>
          <Button
            variant="outline"
            onClick={onSaveAndAddAnother}
            disabled={saving}
          >
            {saving ? <Loader /> : strings.addContact.form.saveAnother}
          </Button>
          <Button
            onClick={onSaveAndClose}
            disabled={saving}
          >
            {saving ? <Loader /> : strings.addContact.form.saveClose}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}