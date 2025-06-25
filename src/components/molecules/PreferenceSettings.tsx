'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/molecules/FormField';
import settingsStrings from '@/data/strings/settings.json';

interface PreferenceSettingsProps {
  settings: {
    language: string;
    timezone: string;
    dateFormat: string;
    theme: string;
  };
  onUpdate: (field: string, value: string) => void;
}

export function PreferenceSettings({ settings, onUpdate }: PreferenceSettingsProps) {
  const strings = settingsStrings;

  return (
    <div className="space-y-4">
      <FormField label={strings.user.preferences.language}>
        <Select value={settings.language} onValueChange={(value) => onUpdate('language', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {strings.languages.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label={strings.user.preferences.timezone}>
        <Select value={settings.timezone} onValueChange={(value) => onUpdate('timezone', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {strings.timezones.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label={strings.user.preferences.dateFormat}>
        <Select value={settings.dateFormat} onValueChange={(value) => onUpdate('dateFormat', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {strings.dateFormats.map((format) => (
              <SelectItem key={format.value} value={format.value}>
                {format.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label={strings.user.preferences.theme}>
        <Select value={settings.theme} onValueChange={(value) => onUpdate('theme', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {strings.themes.map((theme) => (
              <SelectItem key={theme.value} value={theme.value}>
                {theme.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </div>
  );
}