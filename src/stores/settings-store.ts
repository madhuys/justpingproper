import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface UserSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
  };
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  emailPreferences: {
    digest: boolean;
    updates: boolean;
    security: boolean;
  };
}

export interface BusinessSettings {
  businessHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
    workingDays: string[];
  };
  autoReply: {
    enabled: boolean;
    message: string;
    outsideHours: boolean;
    delay: number; // in seconds
  };
  branding: {
    companyLogo: string;
    primaryColor: string;
    secondaryColor: string;
    customCss?: string;
  };
  integrations: {
    slack: boolean;
    teams: boolean;
    webhook: string;
  };
  billing: {
    plan: 'free' | 'pro' | 'enterprise';
    subscriptionId?: string;
    nextBillingDate?: Date;
  };
}

export interface SettingsState {
  // State
  userSettings: UserSettings;
  businessSettings: BusinessSettings;
  isLoading: boolean;
  error: string | null;
  
  // User Settings Actions
  loadUserSettings: () => Promise<void>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  updateNotificationSettings: (notifications: Partial<UserSettings['notifications']>) => Promise<void>;
  updateLanguage: (language: string) => Promise<void>;
  updateTimezone: (timezone: string) => Promise<void>;
  updateTheme: (theme: UserSettings['theme']) => Promise<void>;
  
  // Business Settings Actions
  loadBusinessSettings: () => Promise<void>;
  updateBusinessSettings: (settings: Partial<BusinessSettings>) => Promise<void>;
  updateBusinessHours: (hours: Partial<BusinessSettings['businessHours']>) => Promise<void>;
  updateAutoReply: (autoReply: Partial<BusinessSettings['autoReply']>) => Promise<void>;
  updateBranding: (branding: Partial<BusinessSettings['branding']>) => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;
  
  // Integration Actions
  toggleIntegration: (integration: keyof BusinessSettings['integrations'], enabled: boolean) => Promise<void>;
  updateWebhook: (webhook: string) => Promise<void>;
  
  // Utility Actions
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

const defaultUserSettings: UserSettings = {
  notifications: {
    email: true,
    sms: false,
    push: true,
    marketing: false,
  },
  language: 'en',
  timezone: 'Asia/Kolkata',
  theme: 'system',
  emailPreferences: {
    digest: true,
    updates: true,
    security: true,
  },
};

const defaultBusinessSettings: BusinessSettings = {
  businessHours: {
    enabled: true,
    start: '09:00',
    end: '18:00',
    timezone: 'Asia/Kolkata',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
  autoReply: {
    enabled: false,
    message: 'Thank you for your message. We will get back to you within 24 hours.',
    outsideHours: true,
    delay: 0,
  },
  branding: {
    companyLogo: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
  },
  integrations: {
    slack: false,
    teams: false,
    webhook: '',
  },
  billing: {
    plan: 'free',
  },
};

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        userSettings: defaultUserSettings,
        businessSettings: defaultBusinessSettings,
        isLoading: false,
        error: null,

        // Load User Settings Action
        loadUserSettings: async () => {
          set({ isLoading: true, error: null });
          
          try {
            // TODO: Replace with actual API call
            const response = await fetch('/api/settings/user', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              }
            });

            if (!response.ok) {
              throw new Error('Failed to load user settings');
            }

            const userSettings = await response.json();
            
            set({ 
              userSettings: { ...defaultUserSettings, ...userSettings }, 
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load user settings', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Update User Settings Action
        updateUserSettings: async (settings: Partial<UserSettings>) => {
          set({ isLoading: true, error: null });
          
          try {
            // TODO: Replace with actual API call
            const response = await fetch('/api/settings/user', {
              method: 'PATCH',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              },
              body: JSON.stringify(settings),
            });

            if (!response.ok) {
              throw new Error('Failed to update user settings');
            }

            const updatedSettings = await response.json();
            
            set(state => ({ 
              userSettings: { ...state.userSettings, ...updatedSettings }, 
              isLoading: false 
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update user settings', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Update Notification Settings Action
        updateNotificationSettings: async (notifications: Partial<UserSettings['notifications']>) => {
          const { userSettings } = get();
          const updatedSettings = {
            notifications: { ...userSettings.notifications, ...notifications }
          };
          
          await get().updateUserSettings(updatedSettings);
        },

        // Update Language Action
        updateLanguage: async (language: string) => {
          await get().updateUserSettings({ language });
        },

        // Update Timezone Action
        updateTimezone: async (timezone: string) => {
          await get().updateUserSettings({ timezone });
        },

        // Update Theme Action
        updateTheme: async (theme: UserSettings['theme']) => {
          // Apply theme immediately for better UX
          set(state => ({ 
            userSettings: { ...state.userSettings, theme } 
          }));
          
          await get().updateUserSettings({ theme });
        },

        // Load Business Settings Action
        loadBusinessSettings: async () => {
          set({ isLoading: true, error: null });
          
          try {
            // TODO: Replace with actual API call
            const response = await fetch('/api/settings/business', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              }
            });

            if (!response.ok) {
              throw new Error('Failed to load business settings');
            }

            const businessSettings = await response.json();
            
            set({ 
              businessSettings: { 
                ...defaultBusinessSettings, 
                ...businessSettings,
                billing: {
                  ...defaultBusinessSettings.billing,
                  ...businessSettings.billing,
                  nextBillingDate: businessSettings.billing?.nextBillingDate 
                    ? new Date(businessSettings.billing.nextBillingDate) 
                    : undefined
                }
              }, 
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load business settings', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Update Business Settings Action
        updateBusinessSettings: async (settings: Partial<BusinessSettings>) => {
          set({ isLoading: true, error: null });
          
          try {
            // TODO: Replace with actual API call
            const response = await fetch('/api/settings/business', {
              method: 'PATCH',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              },
              body: JSON.stringify(settings),
            });

            if (!response.ok) {
              throw new Error('Failed to update business settings');
            }

            const updatedSettings = await response.json();
            
            set(state => ({ 
              businessSettings: { ...state.businessSettings, ...updatedSettings }, 
              isLoading: false 
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update business settings', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Update Business Hours Action
        updateBusinessHours: async (hours: Partial<BusinessSettings['businessHours']>) => {
          const { businessSettings } = get();
          const updatedSettings = {
            businessHours: { ...businessSettings.businessHours, ...hours }
          };
          
          await get().updateBusinessSettings(updatedSettings);
        },

        // Update Auto Reply Action
        updateAutoReply: async (autoReply: Partial<BusinessSettings['autoReply']>) => {
          const { businessSettings } = get();
          const updatedSettings = {
            autoReply: { ...businessSettings.autoReply, ...autoReply }
          };
          
          await get().updateBusinessSettings(updatedSettings);
        },

        // Update Branding Action
        updateBranding: async (branding: Partial<BusinessSettings['branding']>) => {
          const { businessSettings } = get();
          const updatedSettings = {
            branding: { ...businessSettings.branding, ...branding }
          };
          
          await get().updateBusinessSettings(updatedSettings);
        },

        // Upload Logo Action
        uploadLogo: async (file: File) => {
          set({ isLoading: true, error: null });
          
          try {
            const formData = new FormData();
            formData.append('logo', file);

            // TODO: Replace with actual API call
            const response = await fetch('/api/settings/business/logo', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              },
              body: formData,
            });

            if (!response.ok) {
              throw new Error('Failed to upload logo');
            }

            const { logoUrl } = await response.json();
            
            await get().updateBranding({ companyLogo: logoUrl });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to upload logo', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Toggle Integration Action
        toggleIntegration: async (
          integration: keyof BusinessSettings['integrations'], 
          enabled: boolean
        ) => {
          const { businessSettings } = get();
          const updatedSettings = {
            integrations: { 
              ...businessSettings.integrations, 
              [integration]: enabled 
            }
          };
          
          await get().updateBusinessSettings(updatedSettings);
        },

        // Update Webhook Action
        updateWebhook: async (webhook: string) => {
          const { businessSettings } = get();
          const updatedSettings = {
            integrations: { ...businessSettings.integrations, webhook }
          };
          
          await get().updateBusinessSettings(updatedSettings);
        },

        // Utility Actions
        clearError: () => set({ error: null }),
        setLoading: (loading: boolean) => set({ isLoading: loading }),
      }),
      {
        name: 'settings-store',
        partialize: (state) => ({ 
          userSettings: state.userSettings,
          businessSettings: state.businessSettings
        }),
      }
    ),
    { name: 'SettingsStore' }
  )
);