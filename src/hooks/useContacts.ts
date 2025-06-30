'use client';

import { useState, useEffect } from 'react';
import contactsStateData from '@/data/states/contacts.json';

export interface ContactGroup {
  id: string;
  name: string;
  contactCount: number;
  dateCreated: string;
  dateUpdated: string;
}

export interface CustomField {
  id: string;
  label: string;
  type: string;
  validation: string;
  validationParam?: string;
  required: boolean;
  order: number;
  options?: string[];
}

export interface GroupSchema {
  id: string;
  name: string;
  fields: CustomField[];
}

export interface FieldMapping {
  groupFieldId: string;
  groupFieldLabel: string;
  mappedColumn: string | null;
  required: boolean;
}

export interface PreviewRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
}

export interface ContactsState {
  groups: ContactGroup[];
  currentGroup: ContactGroup | null;
  selectedGroups: string[];
  searchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  currentPage: number;
  rowsPerPage: number;
  uploadedFile: File | null;
  mappingPreview: any | null;
  importProgress: {
    current: number;
    total: number;
    status: 'idle' | 'importing' | 'completed';
  };
  addContact: {
    formData: Record<string, any>;
    errors: Record<string, string>;
    isDirty: boolean;
    saving: boolean;
  };
  bulkAdd: {
    currentStep: 'upload' | 'mapping' | 'import';
    uploadedFile: File | null;
    fileHeaders: string[];
    fileData: any[];
    fieldMappings: FieldMapping[];
    mappingSearch: string;
    previewRows: PreviewRow[];
    mappingErrors: string[];
    importProgress: {
      current: number;
      total: number;
      imported: number;
      skipped: number;
      errors: number;
    };
    importStatus: 'idle' | 'importing' | 'completed';
  };
  fields: {
    groupInfo: GroupSchema | null;
    customFields: CustomField[];
    groups: { id: string; name: string }[];
    showAddDialog: boolean;
    editingField: CustomField | null;
    fieldForm: {
      label: string;
      type: string;
      validation: string;
      validationParam: string;
      required: boolean;
      options: string[];
    };
    labelSuggestions: string[];
    showSuggestions: boolean;
  };
}

export function useContacts() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<ContactsState>(contactsStateData as ContactsState);

  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Add Contact Page Functions
  const updateAddContactFormData = (fieldId: string, value: any) => {
    setState(prev => ({
      ...prev,
      addContact: {
        ...prev.addContact,
        formData: { ...prev.addContact.formData, [fieldId]: value },
        isDirty: true
      }
    }));
  };

  const setAddContactError = (fieldId: string, error: string) => {
    setState(prev => ({
      ...prev,
      addContact: {
        ...prev.addContact,
        errors: { ...prev.addContact.errors, [fieldId]: error }
      }
    }));
  };

  const clearAddContactError = (fieldId: string) => {
    setState(prev => {
      const newErrors = { ...prev.addContact.errors };
      delete newErrors[fieldId];
      return {
        ...prev,
        addContact: {
          ...prev.addContact,
          errors: newErrors
        }
      };
    });
  };

  const resetAddContactForm = () => {
    setState(prev => ({
      ...prev,
      addContact: {
        formData: {
          countryCode: '+1',
          phoneNumber: ''
        },
        errors: {},
        isDirty: false,
        saving: false
      }
    }));
  };

  const setAddContactSaving = (saving: boolean) => {
    setState(prev => ({
      ...prev,
      addContact: {
        ...prev.addContact,
        saving
      }
    }));
  };

  // Bulk Add Page Functions
  const setBulkAddStep = (step: 'upload' | 'mapping' | 'import') => {
    setState(prev => ({
      ...prev,
      bulkAdd: {
        ...prev.bulkAdd,
        currentStep: step
      }
    }));
  };

  const setBulkAddFile = (file: File | null) => {
    setState(prev => ({
      ...prev,
      bulkAdd: {
        ...prev.bulkAdd,
        uploadedFile: file
      }
    }));
  };

  const setBulkAddFileData = (headers: string[], data: any[]) => {
    setState(prev => ({
      ...prev,
      bulkAdd: {
        ...prev.bulkAdd,
        fileHeaders: headers,
        fileData: data
      }
    }));
  };

  const updateFieldMapping = (fieldId: string, column: string | null) => {
    setState(prev => ({
      ...prev,
      bulkAdd: {
        ...prev.bulkAdd,
        fieldMappings: prev.bulkAdd.fieldMappings.map(m =>
          m.groupFieldId === fieldId ? { ...m, mappedColumn: column } : m
        )
      }
    }));
  };

  const setBulkAddMappingSearch = (search: string) => {
    setState(prev => ({
      ...prev,
      bulkAdd: {
        ...prev.bulkAdd,
        mappingSearch: search
      }
    }));
  };

  const setBulkAddPreviewRows = (rows: PreviewRow[]) => {
    setState(prev => ({
      ...prev,
      bulkAdd: {
        ...prev.bulkAdd,
        previewRows: rows
      }
    }));
  };

  const setBulkAddMappingErrors = (errors: string[]) => {
    setState(prev => ({
      ...prev,
      bulkAdd: {
        ...prev.bulkAdd,
        mappingErrors: errors
      }
    }));
  };

  const updateBulkAddImportProgress = (progress: Partial<ContactsState['bulkAdd']['importProgress']>) => {
    setState(prev => ({
      ...prev,
      bulkAdd: {
        ...prev.bulkAdd,
        importProgress: {
          ...prev.bulkAdd.importProgress,
          ...progress
        }
      }
    }));
  };

  const setBulkAddImportStatus = (status: 'idle' | 'importing' | 'completed') => {
    setState(prev => ({
      ...prev,
      bulkAdd: {
        ...prev.bulkAdd,
        importStatus: status
      }
    }));
  };

  // Fields Page Functions
  const setFieldsGroupInfo = (groupInfo: GroupSchema | null) => {
    setState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        groupInfo
      }
    }));
  };

  const setCustomFields = (fields: CustomField[]) => {
    setState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        customFields: fields
      }
    }));
  };

  const setFieldsGroups = (groups: { id: string; name: string }[]) => {
    setState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        groups
      }
    }));
  };

  const setShowAddFieldDialog = (show: boolean) => {
    setState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        showAddDialog: show
      }
    }));
  };

  const setEditingField = (field: CustomField | null) => {
    setState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        editingField: field
      }
    }));
  };

  const updateFieldForm = (updates: Partial<ContactsState['fields']['fieldForm']>) => {
    setState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        fieldForm: {
          ...prev.fields.fieldForm,
          ...updates
        }
      }
    }));
  };

  const setLabelSuggestions = (suggestions: string[]) => {
    setState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        labelSuggestions: suggestions
      }
    }));
  };

  const setShowSuggestions = (show: boolean) => {
    setState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        showSuggestions: show
      }
    }));
  };

  return {
    loading,
    state,
    // Add Contact functions
    updateAddContactFormData,
    setAddContactError,
    clearAddContactError,
    resetAddContactForm,
    setAddContactSaving,
    // Bulk Add functions
    setBulkAddStep,
    setBulkAddFile,
    setBulkAddFileData,
    updateFieldMapping,
    setBulkAddMappingSearch,
    setBulkAddPreviewRows,
    setBulkAddMappingErrors,
    updateBulkAddImportProgress,
    setBulkAddImportStatus,
    // Fields functions
    setFieldsGroupInfo,
    setCustomFields,
    setFieldsGroups,
    setShowAddFieldDialog,
    setEditingField,
    updateFieldForm,
    setLabelSuggestions,
    setShowSuggestions
  };
}