import { useState } from 'react';
import contactsStrings from '@/data/strings/contacts.json';

export interface FieldValidation {
  type: string;
  validation: string;
  validationParam?: string;
  required: boolean;
}

export function useFieldValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: FieldValidation, value: any): string | null => {
    if (field.required && !value) {
      return contactsStrings.addContact.validation.required;
    }

    switch (field.validation) {
      case 'validEmail':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          return contactsStrings.addContact.validation.invalidEmail;
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
          return contactsStrings.addContact.validation.minLength.replace('{min}', field.validationParam || '0');
        }
        break;
        
      case 'maxLength':
        if (value && value.length > parseInt(field.validationParam || '0')) {
          return contactsStrings.addContact.validation.maxLength.replace('{max}', field.validationParam || '0');
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

  const validateForm = (fields: Array<{ id: string } & FieldValidation>, formData: Record<string, any>) => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const error = validateField(field, formData[field.id]);
      if (error) {
        newErrors[field.id] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const setFieldError = (fieldId: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldId]: error }));
  };

  const clearFieldError = (fieldId: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldId];
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  return {
    errors,
    validateField,
    validateForm,
    setFieldError,
    clearFieldError,
    clearAllErrors
  };
}