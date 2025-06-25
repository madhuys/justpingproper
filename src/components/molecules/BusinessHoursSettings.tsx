'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/molecules/FormField';
import settingsStrings from '@/data/strings/settings.json';

interface BusinessHoursSettingsProps {
  settings: {
    enabled: boolean;
    days: Record<string, { enabled: boolean; start: string; end: string }>;
  };
  onUpdate: (path: string[], value: any) => void;
}

export function BusinessHoursSettings({ settings, onUpdate }: BusinessHoursSettingsProps) {
  const strings = settingsStrings;
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="space-y-4">
      <FormField label={strings.business.hours.enableBusinessHours}>
        <Checkbox
          checked={settings.enabled}
          onCheckedChange={(checked) => onUpdate(['enabled'], checked as boolean)}
        />
      </FormField>

      {settings.enabled && (
        <div className="space-y-3 ml-6">
          {days.map((day) => (
            <div key={day} className="flex items-center gap-4">
              <Checkbox
                checked={settings.days[day].enabled}
                onCheckedChange={(checked) => 
                  onUpdate(['days', day, 'enabled'], checked as boolean)
                }
              />
              <span className="w-24 capitalize">{day}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={settings.days[day].start}
                  onChange={(e) => onUpdate(['days', day, 'start'], e.target.value)}
                  disabled={!settings.days[day].enabled}
                  className="w-32"
                />
                <span>-</span>
                <Input
                  type="time"
                  value={settings.days[day].end}
                  onChange={(e) => onUpdate(['days', day, 'end'], e.target.value)}
                  disabled={!settings.days[day].enabled}
                  className="w-32"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}