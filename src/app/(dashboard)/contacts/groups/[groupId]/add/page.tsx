'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/atoms/Loader';
import { PageHeader } from '@/components/atoms/PageHeader';
import { ContactForm } from '@/components/organisms/ContactForm';
import { Maximize2, Minimize2 } from 'lucide-react';
import contactsStrings from '@/data/strings/contacts.json';
import { useContacts } from '@/hooks/useContacts';
import { useFieldValidation } from '@/hooks/useFieldValidation';
import { useUIPreferences } from '@/hooks/useUIPreferences';
import toast from 'react-hot-toast';

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
  const {
    loading: contactsLoading,
    state,
    updateAddContactFormData,
    resetAddContactForm,
    setAddContactSaving
  } = useContacts();
  const {
    errors,
    validateField,
    validateForm,
    setFieldError,
    clearFieldError,
    clearAllErrors
  } = useFieldValidation();
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [groupSchema, setGroupSchema] = useState<GroupSchema | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

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
      
      mockSchema.fields.forEach(field => {
        updateAddContactFormData(field.id, field.type === 'dropdown' ? '' : '');
      });
    } catch (error) {
      toast.error('Failed to load group schema');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    updateAddContactFormData(fieldId, value);
    
    if (fieldId === 'phoneNumber' || fieldId === 'countryCode') {
      const field = { id: fieldId, type: 'text', validation: 'none', required: true };
      const error = validateField(field, value);
      if (error) {
        setFieldError(fieldId, error);
      } else {
        clearFieldError(fieldId);
      }
    } else {
      const field = groupSchema?.fields.find(f => f.id === fieldId);
      if (field) {
        const error = validateField(field, value);
        if (error) {
          setFieldError(fieldId, error);
        } else {
          clearFieldError(fieldId);
        }
      }
    }
  };

  const handleValidateForm = (): boolean => {
    const allFields = [
      { id: 'phoneNumber', type: 'text', validation: 'none', required: true },
      { id: 'countryCode', type: 'text', validation: 'none', required: true },
      ...(groupSchema?.fields || [])
    ];
    
    return validateForm(allFields, state.addContact.formData);
  };

  const handleSaveAndClose = async () => {
    if (!handleValidateForm()) return;
    
    setAddContactSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(strings.addContact.form.success);
      router.push(`/contacts/groups/${groupId}`);
    } catch (error) {
      toast.error(strings.addContact.form.error);
    } finally {
      setAddContactSaving(false);
    }
  };

  const handleSaveAndAddAnother = async () => {
    if (!handleValidateForm()) return;
    
    setAddContactSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(strings.addContact.form.success);
      
      resetAddContactForm();
      clearAllErrors();
      groupSchema?.fields.forEach(field => {
        updateAddContactFormData(field.id, field.type === 'dropdown' ? '' : '');
      });
    } catch (error) {
      toast.error(strings.addContact.form.error);
    } finally {
      setAddContactSaving(false);
    }
  };

  const handleCancel = () => {
    if (state.addContact.isDirty && !confirm(strings.addContact.form.confirmCancel)) {
      return;
    }
    router.push(`/contacts/groups/${groupId}`);
  };

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
          <span className="text-foreground">{strings.breadcrumbs.addContact}</span>
        </div>

        <PageHeader
          title={strings.addContact.title.replace('{groupName}', groupSchema?.name || '')}
          description={strings.addContact.description}
        />

        <ContactForm
          fields={groupSchema?.fields || []}
          formData={state.addContact.formData}
          errors={errors}
          saving={state.addContact.saving}
          onFieldChange={handleFieldChange}
          onSaveAndClose={handleSaveAndClose}
          onSaveAndAddAnother={handleSaveAndAddAnother}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}