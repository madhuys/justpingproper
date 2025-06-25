'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { FormField } from '@/components/molecules/FormField';
import { Loader } from '@/components/atoms/Loader';
import { Calendar, Mail, Hash, Type, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import contactsStrings from '@/data/strings/contacts.json';
import countryCodes from '@/data/countryCodes.json';
import toast from 'react-hot-toast';
import { useUIPreferences } from '@/hooks/useUIPreferences';

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

interface GroupSchema {
  id: string;
  name: string;
  fields: Field[];
}

export default function AddContactPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  const strings = contactsStrings;
  const { preferences, updateContentExpanded, loading: prefsLoading } = useUIPreferences();
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groupSchema, setGroupSchema] = useState<GroupSchema | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({
    countryCode: '+1',
    phoneNumber: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
            validation: 'minLength',
            validationParam: '2',
            required: true,
            order: 1
          },
          {
            id: '2',
            label: 'Last Name',
            type: 'text',
            validation: 'none',
            required: false,
            order: 2
          },
          {
            id: '3',
            label: 'Email',
            type: 'email',
            validation: 'validEmail',
            required: true,
            order: 3
          },
          {
            id: '4',
            label: 'Date of Birth',
            type: 'date',
            validation: 'pastOnly',
            required: false,
            order: 4
          },
          {
            id: '5',
            label: 'Employee ID',
            type: 'number',
            validation: 'digits5to10',
            required: true,
            order: 5
          },
          {
            id: '6',
            label: 'Department',
            type: 'dropdown',
            validation: 'none',
            required: false,
            order: 6,
            options: ['Sales', 'Marketing', 'Support', 'Engineering', 'HR', 'Finance']
          }
        ]
      };
      
      setGroupSchema(mockSchema);
      
      // Initialize form data with field IDs
      const initialData: Record<string, any> = {
        countryCode: '+1',
        phoneNumber: ''
      };
      mockSchema.fields.forEach(field => {
        initialData[field.id] = field.type === 'dropdown' ? '' : '';
      });
      setFormData(initialData);
    } catch (error) {
      toast.error('Failed to load group schema');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: Field, value: any): string | null => {
    // Required validation
    if (field.required && !value) {
      return strings.addContact.validation.required;
    }

    // Type-specific validation
    switch (field.validation) {
      case 'validEmail':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          return strings.addContact.validation.invalidEmail;
        }
        break;
        
      case 'digits5to10':
        const digitsRegex = /^\d{5,10}$/;
        if (value && !digitsRegex.test(value)) {
          return 'Must be 5-10 digits';
        }
        break;
        
      case 'minLength':
        if (value && value.length < parseInt(field.validationParam || '0')) {
          return strings.addContact.validation.minLength.replace('{min}', field.validationParam || '0');
        }
        break;
        
      case 'maxLength':
        if (value && value.length > parseInt(field.validationParam || '0')) {
          return strings.addContact.validation.maxLength.replace('{max}', field.validationParam || '0');
        }
        break;
        
      case 'pastOnly':
        if (value && new Date(value) > new Date()) {
          return 'Date must be in the past';
        }
        break;
        
      case 'futureOnly':
        if (value && new Date(value) < new Date()) {
          return 'Date must be in the future';
        }
        break;
    }

    return null;
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    setIsDirty(true);
    
    // Find field and validate
    const field = groupSchema?.fields.find(f => f.id === fieldId);
    if (field) {
      const error = validateField(field, value);
      if (error) {
        setErrors(prev => ({ ...prev, [fieldId]: error }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldId];
          return newErrors;
        });
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate phone number
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = strings.addContact.validation.required;
    }
    
    // Validate custom fields
    groupSchema?.fields.forEach(field => {
      const error = validateField(field, formData[field.id]);
      if (error) {
        newErrors[field.id] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAndClose = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      // API call to save contact
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(strings.addContact.form.success);
      router.push(`/contacts/groups/${groupId}`);
    } catch (error) {
      toast.error(strings.addContact.form.error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndAddAnother = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      // API call to save contact
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(strings.addContact.form.success);
      
      // Reset form
      const resetData: Record<string, any> = {
        countryCode: formData.countryCode,
        phoneNumber: ''
      };
      groupSchema?.fields.forEach(field => {
        resetData[field.id] = field.type === 'dropdown' ? '' : '';
      });
      setFormData(resetData);
      setErrors({});
      setIsDirty(false);
    } catch (error) {
      toast.error(strings.addContact.form.error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty && !confirm(strings.addContact.form.confirmCancel)) {
      return;
    }
    router.push(`/contacts/groups/${groupId}`);
  };

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
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
        
      case 'date':
        return (
          <Input
            type="date"
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );
        
      case 'dropdown':
        return (
          <Select
            value={formData[field.id] || ''}
            onValueChange={(value) => handleFieldChange(field.id, value)}
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
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
    }
  };

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
        <span className="text-foreground">{strings.breadcrumbs.addContact}</span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {strings.addContact.title.replace('{groupName}', groupSchema?.name || '')}
        </h1>
        <p className="text-muted-foreground mt-1">{strings.addContact.description}</p>
      </div>

      {/* Contact Form */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Default Fields */}
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
                onValueChange={(value) => handleFieldChange('countryCode', value)}
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
                onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                placeholder="Enter phone number"
              />
            </FormField>
            
            {/* Custom Fields */}
            {groupSchema?.fields.map(field => (
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
          
          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={handleCancel}
            >
              {strings.addContact.form.cancel}
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveAndAddAnother}
              disabled={saving}
            >
              {saving ? <Loader /> : strings.addContact.form.saveAnother}
            </Button>
            <Button
              onClick={handleSaveAndClose}
              disabled={saving}
            >
              {saving ? <Loader /> : strings.addContact.form.saveClose}
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}