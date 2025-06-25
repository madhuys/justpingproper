import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface BusinessProfileData {
  legalBusinessName: string;
  companyEmail: string;
  website: string;
  registeredAddress: string;
  gstNumber: string;
  adminPhoneNumber: string;
  logo: string | null;
  additionalImages: string[];
  countryOfOperation: string;
  industry: string;
  companySize: string;
  aboutCompany: string;
  documents: (string | File)[];
}

export function useBusinessProfile() {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<BusinessProfileData>({
    legalBusinessName: '',
    companyEmail: '',
    website: '',
    registeredAddress: '',
    gstNumber: '',
    adminPhoneNumber: '',
    logo: null,
    additionalImages: [],
    countryOfOperation: '',
    industry: '',
    companySize: '',
    aboutCompany: '',
    documents: []
  });

  const fetchBusinessProfile = async () => {
    try {
      const response = await fetch('/api/business-profile');
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfileData(data.profile);
          return data.profile;
        }
      }
    } catch (error) {
      console.error('Failed to fetch business profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncWithOnboardingData = async () => {
    try {
      const onboardingResponse = await fetch('/api/states/onboarding');
      if (onboardingResponse.ok) {
        const onboardingData = await onboardingResponse.json();
        
        if (onboardingData.companyInfo) {
          setProfileData(prev => ({
            ...prev,
            legalBusinessName: onboardingData.companyInfo.companyName || prev.legalBusinessName,
            website: onboardingData.companyInfo.website || prev.website,
            countryOfOperation: onboardingData.companyInfo.country || prev.countryOfOperation,
            industry: onboardingData.companyInfo.industry || prev.industry,
            companySize: onboardingData.companyInfo.companySize || prev.companySize,
          }));
        }
        
        if (onboardingData.personalInfo) {
          setProfileData(prev => ({
            ...prev,
            companyEmail: onboardingData.personalInfo.email || prev.companyEmail,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to sync with onboarding data:', error);
    }
  };

  const saveProfile = async (data: BusinessProfileData) => {
    try {
      const response = await fetch('/api/business-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: data })
      });

      if (response.ok) {
        await fetch('/api/states/onboarding', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyInfo: {
              companyName: data.legalBusinessName,
              website: data.website,
              country: data.countryOfOperation,
              industry: data.industry,
              companySize: data.companySize
            },
            personalInfo: {
              email: data.companyEmail
            }
          })
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save profile:', error);
      return false;
    }
  };

  const updateField = (field: keyof BusinessProfileData, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    fetchBusinessProfile();
    syncWithOnboardingData();
  }, []);

  return {
    loading,
    profileData,
    updateField,
    saveProfile,
    refreshProfile: fetchBusinessProfile
  };
}