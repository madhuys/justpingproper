import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface UserProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  jobTitle: string;
  department: string;
  role: string;
  bio: string;
  avatar: string | null;
  linkedinUrl: string;
  timezone: string;
}

export function useUserProfile() {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    jobTitle: '',
    department: '',
    role: '',
    bio: '',
    avatar: null,
    linkedinUrl: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfileData(data.profile);
          return data.profile;
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const syncWithOnboardingData = async () => {
    try {
      const onboardingResponse = await fetch('/api/states/onboarding');
      if (onboardingResponse.ok) {
        const onboardingData = await onboardingResponse.json();
        
        let firstName = '';
        let lastName = '';
        if (onboardingData.personalInfo?.fullName) {
          const nameParts = onboardingData.personalInfo.fullName.trim().split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }
        
        setProfileData(prev => ({
          ...prev,
          firstName: prev.firstName || firstName,
          lastName: prev.lastName || lastName,
          email: prev.email || onboardingData.personalInfo?.email || authUser?.email || '',
          role: prev.role || onboardingData.personalInfo?.role || '',
          avatar: prev.avatar || authUser?.photoURL || null
        }));
      }
    } catch (error) {
      console.error('Failed to sync with onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (data: UserProfileData) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: data })
      });

      if (response.ok) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save profile:', error);
      return false;
    }
  };

  const updateField = (field: keyof UserProfileData, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    fetchProfile();
    syncWithOnboardingData();
  }, []);

  return {
    loading,
    profileData,
    updateField,
    saveProfile,
    refreshProfile: fetchProfile,
    authUser
  };
}