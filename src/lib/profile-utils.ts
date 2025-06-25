// Profile completion utilities

interface BusinessProfile {
  legalBusinessName: string;
  companyEmail: string;
  countryOfOperation: string;
  industry: string;
  aboutCompany: string;
}

interface UserProfile {
  fullName: string;
  email: string;
  country: string;
  role: string;
}

export function isBusinessProfileComplete(profile: Partial<BusinessProfile>): boolean {
  const requiredFields: (keyof BusinessProfile)[] = [
    'legalBusinessName',
    'companyEmail',
    'countryOfOperation',
    'industry',
    'aboutCompany'
  ];

  return requiredFields.every(field => {
    const value = profile[field];
    return value !== undefined && value !== null && value !== '';
  });
}

export function isUserProfileComplete(profile: Partial<UserProfile>): boolean {
  const requiredFields: (keyof UserProfile)[] = [
    'fullName',
    'email',
    'country',
    'role'
  ];

  return requiredFields.every(field => {
    const value = profile[field];
    return value !== undefined && value !== null && value !== '';
  });
}

export async function checkProfileCompletion(): Promise<{
  isComplete: boolean;
  needsBusinessProfile: boolean;
  needsUserProfile: boolean;
}> {
  try {
    // Check business profile
    const businessRes = await fetch('/api/business-profile');
    const businessData = await businessRes.json();
    const businessComplete = isBusinessProfileComplete(businessData.profile || {});

    // Check user profile
    const userRes = await fetch('/api/user/profile');
    const userData = await userRes.json();
    const userComplete = isUserProfileComplete(userData || {});

    return {
      isComplete: businessComplete && userComplete,
      needsBusinessProfile: !businessComplete,
      needsUserProfile: !userComplete
    };
  } catch (error) {
    console.error('Error checking profile completion:', error);
    return {
      isComplete: false,
      needsBusinessProfile: true,
      needsUserProfile: true
    };
  }
}