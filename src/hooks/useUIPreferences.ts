'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';

interface UIPreferences {
  theme: string;
  notificationsPaneWidth: number;
  conversationsDateRange: number;
  expandedSections: {
    quickConnect: boolean;
    conversations: boolean;
  };
  pinnedItems: string[];
  preferredChannelView: string;
  contentExpanded: boolean;
}

const DEFAULT_PREFERENCES: UIPreferences = {
  theme: 'system',
  notificationsPaneWidth: 280,
  conversationsDateRange: 7,
  expandedSections: {
    quickConnect: true,
    conversations: true
  },
  pinnedItems: [],
  preferredChannelView: 'all',
  contentExpanded: false
};

export function useUIPreferences() {
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useState<UIPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/states/ui-preferences');
        if (response.ok) {
          const data = await response.json();
          setPreferences(data);
          // Apply theme if different
          if (data.theme && data.theme !== theme) {
            setTheme(data.theme);
          }
        }
      } catch (error) {
        // Use default preferences if API is not available
        console.warn('Failed to load UI preferences, using defaults:', error);
        setPreferences(DEFAULT_PREFERENCES);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [setTheme, theme]);

  // Save preferences
  const savePreferences = useCallback(async (updates: Partial<UIPreferences>) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, ...updates };
      
      // Save to API
      fetch('/api/states/ui-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences)
      }).catch(error => {
        console.error('Failed to save UI preferences:', error);
      });
      
      return newPreferences;
    });
  }, []);

  // Update specific preference
  const updatePreference = useCallback((key: keyof UIPreferences, value: any) => {
    savePreferences({ [key]: value });
  }, [savePreferences]);

  // Update theme and save
  const updateTheme = useCallback((newTheme: string) => {
    setTheme(newTheme);
    savePreferences({ theme: newTheme });
  }, [setTheme, savePreferences]);

  // Update notifications pane width
  const updateNotificationsPaneWidth = useCallback((width: number) => {
    savePreferences({ notificationsPaneWidth: width });
  }, [savePreferences]);

  // Update content expanded state
  const updateContentExpanded = useCallback((expanded: boolean) => {
    savePreferences({ contentExpanded: expanded });
  }, [savePreferences]);

  return {
    preferences,
    loading,
    updatePreference,
    updateTheme,
    updateNotificationsPaneWidth,
    updateContentExpanded,
    savePreferences
  };
}