'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/molecules/FormField';
import settingsStrings from '@/data/strings/settings.json';

interface AutoReplySettingsProps {
  settings: {
    welcome: { enabled: boolean; message: string };
    away: { enabled: boolean; message: string };
    offline: { enabled: boolean; message: string };
  };
  onUpdate: (type: string, field: string, value: any) => void;
}

export function AutoReplySettings({ settings, onUpdate }: AutoReplySettingsProps) {
  const strings = settingsStrings;

  const renderReplySection = (
    type: 'welcome' | 'away' | 'offline',
    label: string,
    placeholder: string
  ) => (
    <div className="space-y-3">
      <FormField label={label}>
        <Checkbox
          checked={settings[type].enabled}
          onCheckedChange={(checked) => onUpdate(type, 'enabled', checked as boolean)}
        />
      </FormField>
      {settings[type].enabled && (
        <div className="ml-6">
          <Textarea
            value={settings[type].message}
            onChange={(e) => onUpdate(type, 'message', e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {renderReplySection(
        'welcome',
        strings.business.autoReplies.welcomeMessage,
        strings.business.autoReplies.welcomePlaceholder
      )}
      {renderReplySection(
        'away',
        strings.business.autoReplies.awayMessage,
        strings.business.autoReplies.awayPlaceholder
      )}
      {renderReplySection(
        'offline',
        strings.business.autoReplies.offlineMessage,
        strings.business.autoReplies.offlinePlaceholder
      )}
    </div>
  );
}