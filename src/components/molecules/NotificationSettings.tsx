'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/molecules/FormField';
import settingsStrings from '@/data/strings/settings.json';

interface NotificationSettingsProps {
  settings: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
  onUpdate: (field: string, value: boolean) => void;
}

export function NotificationSettings({ settings, onUpdate }: NotificationSettingsProps) {
  const strings = settingsStrings;

  return (
    <div className="space-y-4">
      <FormField label={strings.user.notifications.email}>
        <Checkbox
          checked={settings.email}
          onCheckedChange={(checked) => onUpdate('email', checked as boolean)}
        />
      </FormField>

      <FormField label={strings.user.notifications.push}>
        <Checkbox
          checked={settings.push}
          onCheckedChange={(checked) => onUpdate('push', checked as boolean)}
        />
      </FormField>

      <FormField label={strings.user.notifications.sms}>
        <Checkbox
          checked={settings.sms}
          onCheckedChange={(checked) => onUpdate('sms', checked as boolean)}
        />
      </FormField>

      <FormField label={strings.user.notifications.inApp}>
        <Checkbox
          checked={settings.inApp}
          onCheckedChange={(checked) => onUpdate('inApp', checked as boolean)}
        />
      </FormField>
    </div>
  );
}