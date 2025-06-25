import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

// In-memory storage for user-specific states
const userStates: Record<string, any> = {};

export async function GET(request: NextRequest) {
  try {
    // Get user identifier from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth-token')?.value || 'anonymous';
    
    const userStateKey = `${userId}_businessProfile`;
    
    if (userStates[userStateKey]) {
      return NextResponse.json(userStates[userStateKey]);
    }

    // Read the default state file
    const filePath = path.join(process.cwd(), 'src', 'data', 'states', 'businessProfile.json');
    
    try {
      const fileContents = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(fileContents);
      
      // Initialize user state with default
      userStates[userStateKey] = data;
      
      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching business profile state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business profile state' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json();
    
    // Get user identifier from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth-token')?.value || 'anonymous';
    
    const userStateKey = `${userId}_businessProfile`;
    const onboardingStateKey = `${userId}_onboarding`;
    
    // Get current state or load default
    if (!userStates[userStateKey]) {
      const filePath = path.join(process.cwd(), 'src', 'data', 'states', 'businessProfile.json');
      try {
        const fileContents = await fs.readFile(filePath, 'utf8');
        userStates[userStateKey] = JSON.parse(fileContents);
      } catch (error) {
        userStates[userStateKey] = {
          profile: {},
          knowledgebases: [],
          isEditing: false,
          lastUpdated: null
        };
      }
    }
    
    // Update business profile state
    userStates[userStateKey] = {
      ...userStates[userStateKey],
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    // If profile data is being updated, sync with onboarding
    if (updates.profile) {
      // Get or initialize onboarding state
      if (!userStates[onboardingStateKey]) {
        const onboardingPath = path.join(process.cwd(), 'src', 'data', 'states', 'onboarding.json');
        try {
          const onboardingContents = await fs.readFile(onboardingPath, 'utf8');
          userStates[onboardingStateKey] = JSON.parse(onboardingContents);
        } catch (error) {
          userStates[onboardingStateKey] = {};
        }
      }
      
      // Sync relevant fields to onboarding
      if (userStates[onboardingStateKey].companyInfo) {
        userStates[onboardingStateKey].companyInfo = {
          ...userStates[onboardingStateKey].companyInfo,
          companyName: updates.profile.legalBusinessName || userStates[onboardingStateKey].companyInfo.companyName,
          website: updates.profile.website || userStates[onboardingStateKey].companyInfo.website,
          country: updates.profile.countryOfOperation || userStates[onboardingStateKey].companyInfo.country,
          industry: updates.profile.industry || userStates[onboardingStateKey].companyInfo.industry
        };
      }
      
      if (userStates[onboardingStateKey].personalInfo && updates.profile.companyEmail) {
        userStates[onboardingStateKey].personalInfo = {
          ...userStates[onboardingStateKey].personalInfo,
          email: updates.profile.companyEmail
        };
      }
      
      // Mark profile creation step as completed
      if (userStates[onboardingStateKey].steps) {
        const profileStepIndex = userStates[onboardingStateKey].steps.findIndex((s: any) => s.id === 'create-profile');
        if (profileStepIndex !== -1) {
          userStates[onboardingStateKey].steps[profileStepIndex].completed = true;
        }
      }
    }
    
    return NextResponse.json(userStates[userStateKey]);
  } catch (error) {
    console.error('Error updating business profile state:', error);
    return NextResponse.json(
      { error: 'Failed to update business profile state' },
      { status: 500 }
    );
  }
}