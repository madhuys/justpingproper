'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FormField } from '@/components/molecules/FormField';
import { Loader } from '@/components/atoms/Loader';
import { EmptyState } from '@/components/atoms/EmptyState';
import { 
  GripVertical,
  Lock,
  Plus,
  Edit,
  Trash2,
  Copy,
  ListChecks,
  Phone,
  Globe,
  Search,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import contactsStrings from '@/data/strings/contacts.json';
import fieldTypesData from '@/data/contactFieldTypes.json';
import toast from 'react-hot-toast';
import { useUIPreferences } from '@/hooks/useUIPreferences';

interface CustomField {
  id: string;
  label: string;
  type: string;
  validation: string;
  validationParam?: string;
  required: boolean;
  order: number;
  options?: string[]; // For dropdown type
}

interface GroupInfo {
  id: string;
  name: string;
  fields: CustomField[];
}

export default function GroupFieldsPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  const strings = contactsStrings;
  const { preferences, updateContentExpanded, loading: prefsLoading } = useUIPreferences();
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Add field dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldValidation, setFieldValidation] = useState('none');
  const [fieldValidationParam, setFieldValidationParam] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldOptions, setFieldOptions] = useState<string[]>(['']);
  const [labelSuggestions, setLabelSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchGroupInfo();
    fetchGroups();
  }, [groupId]);

  // Set initial expanded state from preferences
  useEffect(() => {
    if (!prefsLoading) {
      if (preferences.contentExpanded !== undefined) {
        setIsExpanded(preferences.contentExpanded);
      }
    }
  }, [preferences.contentExpanded, prefsLoading]);

  const fetchGroupInfo = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockGroupInfo: GroupInfo = {
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
      
      setGroupInfo(mockGroupInfo);
      setCustomFields(mockGroupInfo.fields);
    } catch (error) {
      toast.error('Failed to load group information');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      // Simulate API call
      const mockGroups = [
        { id: '1', name: 'VIP_Customers' },
        { id: '2', name: 'Newsletter_Subscribers' },
        { id: '3', name: 'Support_Contacts' }
      ];
      setGroups(mockGroups.filter(g => g.id !== groupId));
    } catch (error) {
      console.error('Failed to fetch groups');
    }
  };

  const handleCopyFromGroup = async (sourceGroupId: string) => {
    try {
      // Simulate API call to get source group fields
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock copied fields
      const copiedFields: CustomField[] = [
        {
          id: Date.now().toString(),
          label: 'Department',
          type: 'dropdown',
          validation: 'none',
          required: false,
          order: customFields.length + 1,
          options: ['Sales', 'Marketing', 'Support', 'Engineering']
        }
      ];
      
      setCustomFields(prev => [...prev, ...copiedFields]);
      toast.success(strings.fields.copySchema.success);
    } catch (error) {
      toast.error('Failed to copy fields');
    }
  };

  const handleAddField = () => {
    setEditingField(null);
    setFieldLabel('');
    setFieldType('text');
    setFieldValidation('none');
    setFieldValidationParam('');
    setFieldRequired(false);
    setFieldOptions(['']);
    setShowAddDialog(true);
  };

  const handleEditField = (field: CustomField) => {
    setEditingField(field);
    setFieldLabel(field.label);
    setFieldType(field.type);
    setFieldValidation(field.validation);
    setFieldValidationParam(field.validationParam || '');
    setFieldRequired(field.required);
    setFieldOptions(field.options || ['']);
    setShowAddDialog(true);
  };

  const handleSaveField = () => {
    if (!fieldLabel.trim()) {
      toast.error('Field label is required');
      return;
    }

    const fieldData: CustomField = {
      id: editingField?.id || Date.now().toString(),
      label: fieldLabel,
      type: fieldType,
      validation: fieldValidation,
      validationParam: fieldValidationParam,
      required: fieldRequired,
      order: editingField?.order || customFields.length + 1,
      options: fieldType === 'dropdown' ? fieldOptions.filter(opt => opt.trim()) : undefined
    };

    if (editingField) {
      setCustomFields(prev => prev.map(f => f.id === editingField.id ? fieldData : f));
      toast.success('Field updated successfully');
    } else {
      setCustomFields(prev => [...prev, fieldData]);
      toast.success('Field added successfully');
    }

    setShowAddDialog(false);
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm(strings.fields.customFields.actions.confirmDelete)) return;
    
    setCustomFields(prev => prev.filter(f => f.id !== fieldId));
    toast.success('Field deleted successfully');
  };

  const handleReorderFields = (dragIndex: number, dropIndex: number) => {
    const reorderedFields = Array.from(customFields);
    const [draggedField] = reorderedFields.splice(dragIndex, 1);
    reorderedFields.splice(dropIndex, 0, draggedField);
    
    // Update order values
    const updatedFields = reorderedFields.map((field, index) => ({
      ...field,
      order: index + 1
    }));
    
    setCustomFields(updatedFields);
  };

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

  const handleLabelInput = (value: string) => {
    setFieldLabel(value);
    
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
      // API call to save all fields
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Fields saved successfully');
      router.push(`/contacts/groups/${groupId}/add`);
    } catch (error) {
      toast.error('Failed to save fields');
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
            onClick={() => router.push('/contacts')}
            className="hover:text-foreground"
          >
            {strings.breadcrumbs.groups}
          </button>
          <span>/</span>
          <span className="text-foreground">{strings.breadcrumbs.fields}</span>
        </div>

      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">
            {strings.fields.title.replace('{groupName}', groupInfo?.name || '')}
          </h1>
          <p className="text-muted-foreground mt-1">{strings.fields.description}</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/contacts')}>
            Cancel
          </Button>
          <Button onClick={handleSaveAll}>
            Save & Continue
          </Button>
        </div>
      </div>

      {/* Locked Default Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Default Fields</CardTitle>
        </CardHeader>
        <CardContent>
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

      {/* Copy Schema Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Copy className="h-5 w-5 text-muted-foreground" />
            <Select onValueChange={handleCopyFromGroup}>
              <SelectTrigger className="flex-1 w-full">
                <SelectValue placeholder={strings.fields.copySchema.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {groups.map(group => (
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

      {/* Custom Fields Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{strings.fields.customFields.title}</CardTitle>
            <Button onClick={handleAddField} size="sm">
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
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="p-4 text-left font-medium">
                      {strings.fields.customFields.columns.order}
                    </th>
                    <th className="p-4 text-left font-medium">
                      {strings.fields.customFields.columns.label}
                    </th>
                    <th className="p-4 text-left font-medium">
                      {strings.fields.customFields.columns.type}
                    </th>
                    <th className="p-4 text-left font-medium">
                      {strings.fields.customFields.columns.validation}
                    </th>
                    <th className="p-4 text-left font-medium">
                      {strings.fields.customFields.columns.required}
                    </th>
                    <th className="p-4 text-left font-medium">
                      {strings.fields.customFields.columns.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customFields.map((field, index) => (
                    <tr key={field.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          <span className="ml-2">{field.order}</span>
                        </div>
                      </td>
                      <td className="p-4 font-medium">{field.label}</td>
                      <td className="p-4">
                        <Badge variant="secondary">
                          {strings.fields.customFields.types[field.type]}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">
                        {strings.fields.customFields.validations[field.validation]}
                        {field.validationParam && (
                          <span className="text-muted-foreground ml-1">
                            ({field.validationParam})
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <Checkbox checked={field.required} disabled />
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditField(field)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteField(field.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Field Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingField ? 'Edit Field' : strings.fields.addField.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <FormField label={strings.fields.addField.labelLabel} required>
              <div className="relative">
                <Input
                  value={fieldLabel}
                  onChange={(e) => handleLabelInput(e.target.value)}
                  placeholder={strings.fields.addField.labelPlaceholder}
                />
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-10">
                    {labelSuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                        onClick={() => {
                          setFieldLabel(suggestion);
                          setShowSuggestions(false);
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </FormField>

            <FormField label={strings.fields.addField.typeLabel}>
              <Select value={fieldType} onValueChange={setFieldType}>
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
              <Select value={fieldValidation} onValueChange={setFieldValidation}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getValidationsForType(fieldType).map(validation => (
                    <SelectItem key={validation.value} value={validation.value}>
                      {validation.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {fieldTypesData.validationRules[fieldValidation]?.requiresParam && (
              <FormField 
                label={fieldTypesData.validationRules[fieldValidation].paramLabel}
              >
                <Input
                  value={fieldValidationParam}
                  onChange={(e) => setFieldValidationParam(e.target.value)}
                  placeholder="Enter value"
                />
              </FormField>
            )}

            {fieldType === 'dropdown' && (
              <FormField label="Options">
                <div className="space-y-2">
                  {fieldOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...fieldOptions];
                          newOptions[index] = e.target.value;
                          setFieldOptions(newOptions);
                        }}
                        placeholder={`Option ${index + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFieldOptions(prev => prev.filter((_, i) => i !== index));
                        }}
                        disabled={fieldOptions.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFieldOptions(prev => [...prev, ''])}
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
                checked={fieldRequired}
                onCheckedChange={(checked) => setFieldRequired(checked as boolean)}
              />
              <label htmlFor="required" className="text-sm font-medium">
                {strings.fields.addField.requiredLabel}
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {strings.fields.addField.cancelButton}
            </Button>
            <Button onClick={handleSaveField}>
              {strings.fields.addField.saveButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}