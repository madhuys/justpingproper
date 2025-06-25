'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader } from '@/components/atoms/Loader';
import { NotificationSettings } from '@/components/molecules/NotificationSettings';
import { PreferenceSettings } from '@/components/molecules/PreferenceSettings';
import { BusinessHoursSettings } from '@/components/molecules/BusinessHoursSettings';
import { AutoReplySettings } from '@/components/molecules/AutoReplySettings';
import { useSettings } from '@/hooks/useSettings';
import { 
  Settings as SettingsIcon,
  User, 
  Building2, 
  Bell,
  Globe,
  Clock,
  ChevronDown,
  ChevronRight,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import settingsStrings from '@/data/strings/settings.json';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const strings = settingsStrings;
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<'user' | 'business'>('user');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    notifications: true,
    preferences: false,
    hours: true,
    replies: false,
  });

  const {
    loading,
    isSaving,
    userSettings,
    businessSettings,
    updateUserSetting,
    updateBusinessSetting,
    saveSettings
  } = useSettings();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSave = async () => {
    const success = await saveSettings(activeSection);
    if (success) {
      toast.success(strings.messages.saveSuccess);
    } else {
      toast.error(strings.messages.saveError);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardContent className="p-8">
          {/* Header Section */}
          <div className="text-center space-y-6 mb-8">
            <div>
              <h1 className="text-2xl font-bold">{strings.header.title}</h1>
              <p className="text-muted-foreground mt-1">{strings.header.description}</p>
            </div>
            
            {/* Section Tabs */}
            <div className="flex justify-center">
              <div className="inline-flex rounded-lg bg-muted p-1">
                <button
                  onClick={() => setActiveSection('user')}
                  className={cn(
                    "px-6 py-2 text-sm font-medium rounded-md transition-colors",
                    activeSection === 'user' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  {strings.tabs.userSettings}
                </button>
                <button
                  onClick={() => setActiveSection('business')}
                  className={cn(
                    "px-6 py-2 text-sm font-medium rounded-md transition-colors",
                    activeSection === 'business' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Building2 className="w-4 h-4 inline mr-2" />
                  {strings.tabs.businessSettings}
                </button>
              </div>
            </div>
          </div>

          {/* User Settings */}
          {activeSection === 'user' && (
            <div className="space-y-6">
              {/* Notifications */}
              <Collapsible
                open={openSections.notifications}
                onOpenChange={() => toggleSection('notifications')}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5" />
                    <span className="font-medium">{strings.user.notifications.title}</span>
                  </div>
                  {openSections.notifications ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <NotificationSettings
                    settings={userSettings.notifications}
                    onUpdate={(field, value) => 
                      updateUserSetting(['notifications', field], value)
                    }
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Preferences */}
              <Collapsible
                open={openSections.preferences}
                onOpenChange={() => toggleSection('preferences')}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5" />
                    <span className="font-medium">{strings.user.preferences.title}</span>
                  </div>
                  {openSections.preferences ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <PreferenceSettings
                    settings={userSettings.preferences}
                    onUpdate={(field, value) => 
                      updateUserSetting(['preferences', field], value)
                    }
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Business Settings */}
          {activeSection === 'business' && (
            <div className="space-y-6">
              {/* Business Hours */}
              <Collapsible
                open={openSections.hours}
                onOpenChange={() => toggleSection('hours')}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">{strings.business.hours.title}</span>
                  </div>
                  {openSections.hours ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <BusinessHoursSettings
                    settings={businessSettings.businessHours}
                    onUpdate={(path, value) => 
                      updateBusinessSetting(['businessHours', ...path], value)
                    }
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Auto Replies */}
              <Collapsible
                open={openSections.replies}
                onOpenChange={() => toggleSection('replies')}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <SettingsIcon className="h-5 w-5" />
                    <span className="font-medium">{strings.business.autoReply.title}</span>
                  </div>
                  {openSections.replies ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <AutoReplySettings
                    settings={businessSettings.autoReplies}
                    onUpdate={(type, field, value) => 
                      updateBusinessSetting(['autoReplies', type, field], value)
                    }
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-[150px]"
            >
              {isSaving ? (
                <Loader />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {strings.actions.save}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}