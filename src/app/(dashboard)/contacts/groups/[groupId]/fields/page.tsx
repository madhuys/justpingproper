'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader } from '@/components/atoms/Loader';
import { PageHeader } from '@/components/atoms/PageHeader';
import { FieldManager } from '@/components/organisms/FieldManager';
import { FieldEditorDialog } from '@/components/organisms/FieldEditorDialog';
import { Copy, Lock, Phone, Globe, Maximize2, Minimize2 } from 'lucide-react';
import contactsStrings from '@/data/strings/contacts.json';
import { useContacts } from '@/hooks/useContacts';
import { useUIPreferences } from '@/hooks/useUIPreferences';
import toast from 'react-hot-toast';

export default function GroupFieldsPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  const strings = contactsStrings;
  const { preferences, updateContentExpanded, loading: prefsLoading } = useUIPreferences();
  const {
    loading: contactsLoading,
    state,
    setFieldsGroupInfo,
    setCustomFields,
    setFieldsGroups,
    setShowAddFieldDialog,
    setEditingField,
    updateFieldForm,
    setLabelSuggestions,
    setShowSuggestions
  } = useContacts();
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchGroupInfo();
    fetchGroups();
  }, [groupId]);

  useEffect(() => {
    if (!prefsLoading && preferences.contentExpanded !== undefined) {
      setIsExpanded(preferences.contentExpanded);
    }
  }, [preferences.contentExpanded, prefsLoading]);

  const fetchGroupInfo = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockGroupInfo = {
        id: groupId,
        name: 'VIP_Customers',
        fields: [
          {
            id: '1',
            label: 'First Name',
            type: 'text',
            validation: 'none',
            required: true,
            order: 1
          },
          {
            id: '2',
            label: 'Email',
            type: 'email',
            validation: 'validEmail',
            required: true,
            order: 2
          }
        ]
      };
      
      setFieldsGroupInfo(mockGroupInfo);
      setCustomFields(mockGroupInfo.fields);
    } catch (error) {
      toast.error('Failed to load group information');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const mockGroups = [
        { id: '1', name: 'VIP_Customers' },
        { id: '2', name: 'Newsletter_Subscribers' },
        { id: '3', name: 'Support_Contacts' }
      ];
      setFieldsGroups(mockGroups.filter(g => g.id !== groupId));
    } catch (error) {
      console.error('Failed to fetch groups');
    }
  };

  const handleCopyFromGroup = async (sourceGroupId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const copiedFields = [
        {
          id: Date.now().toString(),
          label: 'Department',
          type: 'dropdown',
          validation: 'none',
          required: false,
          order: state.fields.customFields.length + 1,
          options: ['Sales', 'Marketing', 'Support', 'Engineering']
        }
      ];
      
      setCustomFields([...state.fields.customFields, ...copiedFields]);
      toast.success(strings.fields.copySchema.success);
    } catch (error) {
      toast.error('Failed to copy fields');
    }
  };

  const handleAddField = () => {
    setEditingField(null);
    updateFieldForm({
      label: '',
      type: 'text',
      validation: 'none',
      validationParam: '',
      required: false,
      options: ['']
    });
    setShowAddFieldDialog(true);
  };

  const handleEditField = (field: any) => {
    setEditingField(field);
    updateFieldForm({
      label: field.label,
      type: field.type,
      validation: field.validation,
      validationParam: field.validationParam || '',
      required: field.required,
      options: field.options || ['']
    });
    setShowAddFieldDialog(true);
  };

  const handleSaveField = () => {
    if (!state.fields.fieldForm.label.trim()) {
      toast.error('Field label is required');
      return;
    }

    const fieldData = {
      id: state.fields.editingField?.id || Date.now().toString(),
      label: state.fields.fieldForm.label,
      type: state.fields.fieldForm.type,
      validation: state.fields.fieldForm.validation,
      validationParam: state.fields.fieldForm.validationParam,
      required: state.fields.fieldForm.required,
      order: state.fields.editingField?.order || state.fields.customFields.length + 1,
      options: state.fields.fieldForm.type === 'dropdown' ? 
        state.fields.fieldForm.options.filter(opt => opt.trim()) : undefined
    };

    if (state.fields.editingField) {
      setCustomFields(state.fields.customFields.map(f => 
        f.id === state.fields.editingField.id ? fieldData : f
      ));
      toast.success('Field updated successfully');
    } else {
      setCustomFields([...state.fields.customFields, fieldData]);
      toast.success('Field added successfully');
    }

    setShowAddFieldDialog(false);
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm(strings.fields.customFields.actions.confirmDelete)) return;
    
    setCustomFields(state.fields.customFields.filter(f => f.id !== fieldId));
    toast.success('Field deleted successfully');
  };

  const handleLabelInput = (value: string) => {
    updateFieldForm({ label: value });
    
    if (value.length > 0) {
      const filtered = strings.fields.addField.labelSuggestions.filter(s =>
        s.toLowerCase().includes(value.toLowerCase())
      );
      setLabelSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Fields saved successfully');
      router.push(`/contacts/groups/${groupId}/add`);
    } catch (error) {
      toast.error('Failed to save fields');
    }
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
            onClick={() => router.push('/contacts')}
            className="hover:text-foreground"
          >
            {strings.breadcrumbs.groups}
          </button>
          <span>/</span>
          <span className="text-foreground">{strings.breadcrumbs.fields}</span>
        </div>

        <div className="flex justify-between items-start">
          <PageHeader
            title={strings.fields.title.replace('{groupName}', state.fields.groupInfo?.name || '')}
            description={strings.fields.description}
          />
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/contacts')}>
              Cancel
            </Button>
            <Button onClick={handleSaveAll}>
              Save & Continue
            </Button>
          </div>
        </div>

        <Card className="glassmorphic-modal">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Default Fields</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {strings.fields.lockedDefaults.countryCode.label}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {strings.fields.lockedDefaults.countryCode.type} • {strings.fields.lockedDefaults.countryCode.note}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {strings.fields.lockedDefaults.phoneNumber.label}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {strings.fields.lockedDefaults.phoneNumber.type} • {strings.fields.lockedDefaults.phoneNumber.note}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphic-modal">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Copy className="h-5 w-5 text-muted-foreground" />
              <Select onValueChange={handleCopyFromGroup}>
                <SelectTrigger className="flex-1 w-full">
                  <SelectValue placeholder={strings.fields.copySchema.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {state.fields.groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                {strings.fields.copySchema.button}
              </Button>
            </div>
          </CardContent>
        </Card>

        <FieldManager
          customFields={state.fields.customFields}
          onAddField={handleAddField}
          onEditField={handleEditField}
          onDeleteField={handleDeleteField}
        />

        <FieldEditorDialog
          isOpen={state.fields.showAddDialog}
          isEditing={!!state.fields.editingField}
          fieldForm={state.fields.fieldForm}
          labelSuggestions={state.fields.labelSuggestions}
          showSuggestions={state.fields.showSuggestions}
          onClose={() => setShowAddFieldDialog(false)}
          onSave={handleSaveField}
          onFieldFormChange={updateFieldForm}
          onLabelInput={handleLabelInput}
          onSuggestionSelect={(suggestion) => {
            updateFieldForm({ label: suggestion });
            setShowSuggestions(false);
          }}
        />
      </div>
    </div>
  );
}