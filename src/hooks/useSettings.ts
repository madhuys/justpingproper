import { useState, useEffect } from 'react';
import settingsState from '@/data/states/settings.json';
import toast from 'react-hot-toast';

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    dateFormat: string;
    theme: string;
  };
}

export interface BusinessSettings {
  businessHours: {
    enabled: boolean;
    days: {
      monday: { enabled: boolean; start: string; end: string };
      tuesday: { enabled: boolean; start: string; end: string };
      wednesday: { enabled: boolean; start: string; end: string };
      thursday: { enabled: boolean; start: string; end: string };
      friday: { enabled: boolean; start: string; end: string };
      saturday: { enabled: boolean; start: string; end: string };
      sunday: { enabled: boolean; start: string; end: string };
    };
  };
  autoReplies: {
    welcome: { enabled: boolean; message: string };
    away: { enabled: boolean; message: string };
    offline: { enabled: boolean; message: string };
  };
  branding: {
    primaryColor: string;
    logo: string;
    favicon: string;
  };
}

export function useSettings() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>(settingsState.user as UserSettings);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(settingsState.business as BusinessSettings);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.user) setUserSettings(data.user);
        if (data.business) setBusinessSettings(data.business);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (section: 'user' | 'business') => {
    try {
      setIsSaving(true);
      const settings = section === 'user' ? userSettings : businessSettings;
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [section]: settings })
      });

      if (response.ok) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateUserSetting = (path: string[], value: any) => {
    setUserSettings(prev => {
      const updated = { ...prev };
      let current: any = updated;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return updated;
    });
  };

  const updateBusinessSetting = (path: string[], value: any) => {
    setBusinessSettings(prev => {
      const updated = { ...prev };
      let current: any = updated;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return updated;
    });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    loading,
    isSaving,
    userSettings,
    businessSettings,
    updateUserSetting,
    updateBusinessSetting,
    saveSettings,
    refreshSettings: fetchSettings
  };
}