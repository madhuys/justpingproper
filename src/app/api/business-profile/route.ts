import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const BUSINESS_PROFILE_FILE_PATH = path.join(process.cwd(), 'src/data/states/businessProfile.json');

// GET /api/business-profile - Get business profile
export async function GET(request: NextRequest) {
  try {
    // Read the business profile data from JSON file
    const fileContent = await fs.readFile(BUSINESS_PROFILE_FILE_PATH, 'utf-8');
    const profileData = JSON.parse(fileContent);
    
    return NextResponse.json({ 
      success: true,
      profile: profileData 
    });
  } catch (error) {
    console.error('Business profile fetch error:', error);
    
    // If file doesn't exist, return default profile
    return NextResponse.json({ 
      success: true,
      profile: {
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
        aboutCompany: '',
        documents: []
      }
    });
  }
}

// PUT /api/business-profile - Update business profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile } = body;
    
    // Ensure the directory exists
    const dir = path.dirname(BUSINESS_PROFILE_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    
    // Write the updated profile data to JSON file
    await fs.writeFile(
      BUSINESS_PROFILE_FILE_PATH,
      JSON.stringify(profile, null, 2),
      'utf-8'
    );
    
    return NextResponse.json({ 
      success: true,
      profile 
    });
  } catch (error) {
    console.error('Business profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update business profile' },
      { status: 500 }
    );
  }
}