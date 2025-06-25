import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const PROFILE_FILE_PATH = path.join(process.cwd(), 'src/data/states/userProfile.json');

// GET /api/user/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    // Read the profile data from JSON file
    const fileContent = await fs.readFile(PROFILE_FILE_PATH, 'utf-8');
    const profileData = JSON.parse(fileContent);
    
    return NextResponse.json({ profile: profileData });
  } catch (error) {
    console.error('Profile fetch error:', error);
    
    // If file doesn't exist, return empty profile
    return NextResponse.json({ 
      profile: {
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
      }
    });
  }
}

// PUT /api/user/profile - Update user profile  
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile } = body;
    
    // Ensure the directory exists
    const dir = path.dirname(PROFILE_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    
    // Write the updated profile data to JSON file
    await fs.writeFile(
      PROFILE_FILE_PATH,
      JSON.stringify(profile, null, 2),
      'utf-8'
    );
    
    return NextResponse.json({ 
      success: true, 
      profile 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}