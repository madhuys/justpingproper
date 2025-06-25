'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/molecules/FormField';
import { Combobox } from '@/components/ui/combobox';
import departments from '@/data/departments.json';
import profileStrings from '@/data/strings/profile.json';

interface UserProfileFieldsProps {
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    jobTitle: string;
    department: string;
    bio: string;
    linkedinUrl: string;
    timezone: string;
  };
  isEditing: boolean;
  onUpdate: (field: string, value: any) => void;
}

export function UserProfileFields({ 
  data, 
  isEditing, 
  onUpdate 
}: UserProfileFieldsProps) {
  const strings = profileStrings;
  
  const departmentOptions = departments.map((dept) => ({
    value: dept.name,
    label: dept.name
  }));

  return (
    <div className="space-y-6">
      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label={strings.fields.firstName} required>
          {isEditing ? (
            <Input
              value={data.firstName}
              onChange={(e) => onUpdate('firstName', e.target.value)}
              className="w-full"
            />
          ) : (
            <p className="py-2 text-foreground">{data.firstName || '-'}</p>
          )}
        </FormField>

        <FormField label={strings.fields.lastName} required>
          {isEditing ? (
            <Input
              value={data.lastName}
              onChange={(e) => onUpdate('lastName', e.target.value)}
              className="w-full"
            />
          ) : (
            <p className="py-2 text-foreground">{data.lastName || '-'}</p>
          )}
        </FormField>
      </div>

      {/* Email */}
      <FormField label={strings.fields.email} required>
        {isEditing ? (
          <Input
            type="email"
            value={data.email}
            onChange={(e) => onUpdate('email', e.target.value)}
            className="w-full"
          />
        ) : (
          <p className="py-2 text-foreground">{data.email || '-'}</p>
        )}
      </FormField>

      {/* Phone */}
      <FormField label={strings.fields.phoneNumber} required>
        {isEditing ? (
          <Input
            value={data.phoneNumber}
            onChange={(e) => onUpdate('phoneNumber', e.target.value)}
            className="w-full"
            placeholder={strings.placeholders.phoneNumber}
          />
        ) : (
          <p className="py-2 text-foreground">{data.phoneNumber || '-'}</p>
        )}
      </FormField>

      {/* Job Title */}
      <FormField label={strings.fields.jobTitle} required>
        {isEditing ? (
          <Input
            value={data.jobTitle}
            onChange={(e) => onUpdate('jobTitle', e.target.value)}
            className="w-full"
          />
        ) : (
          <p className="py-2 text-foreground">{data.jobTitle || '-'}</p>
        )}
      </FormField>

      {/* Department */}
      <FormField label={strings.fields.department} required>
        {isEditing ? (
          <Combobox
            options={departmentOptions}
            value={data.department}
            onChange={(value) => onUpdate('department', value)}
            placeholder={strings.placeholders.department}
            searchPlaceholder={strings.placeholders.searchDepartments}
            emptyText={strings.placeholders.noDepartmentFound}
            className="w-full"
          />
        ) : (
          <p className="py-2 text-foreground">{data.department || '-'}</p>
        )}
      </FormField>

      {/* Bio */}
      <FormField label={strings.fields.bio}>
        {isEditing ? (
          <Textarea
            value={data.bio}
            onChange={(e) => onUpdate('bio', e.target.value)}
            className="w-full"
            rows={4}
            placeholder={strings.placeholders.bio}
          />
        ) : (
          <p className="py-2 text-foreground whitespace-pre-wrap">{data.bio || '-'}</p>
        )}
      </FormField>

      {/* LinkedIn URL */}
      <FormField label={strings.fields.linkedinUrl}>
        {isEditing ? (
          <Input
            type="url"
            value={data.linkedinUrl}
            onChange={(e) => onUpdate('linkedinUrl', e.target.value)}
            className="w-full"
            placeholder={strings.placeholders.linkedinUrl}
          />
        ) : (
          <p className="py-2 text-foreground">{data.linkedinUrl || '-'}</p>
        )}
      </FormField>

      {/* Timezone */}
      <FormField label={strings.fields.timezone}>
        <p className="py-2 text-foreground">{data.timezone}</p>
      </FormField>
    </div>
  );
}