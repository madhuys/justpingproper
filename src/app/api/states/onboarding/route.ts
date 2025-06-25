import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const ONBOARDING_FILE_PATH = path.join(process.cwd(), 'src/data/states/onboarding.json');

// GET endpoint to fetch onboarding state
export async function GET() {
  try {
    const data = await fs.readFile(ONBOARDING_FILE_PATH, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading onboarding state:', error);
    // Return default state if file doesn't exist
    return NextResponse.json({
      steps: [],
      settings: {
        showWelcomeScreen: true,
        defaultScreen: 'welcome',
        onboardingComplete: false
      },
      company: {},
      companyDetails: {},
      adminDetails: {},
      currentStep: '/onboarding/company'
    });
  }
}

// PUT endpoint to update onboarding state
export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json();
    
    // Read existing data
    let existingData = {};
    try {
      const fileContent = await fs.readFile(ONBOARDING_FILE_PATH, 'utf-8');
      existingData = JSON.parse(fileContent);
    } catch (error) {
      // File doesn't exist, start with empty object
    }
    
    // Merge updates with existing data
    const newData = {
      ...existingData,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Ensure directory exists
    const dir = path.dirname(ONBOARDING_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    
    // Write updated data
    await fs.writeFile(ONBOARDING_FILE_PATH, JSON.stringify(newData, null, 2));
    
    return NextResponse.json({ success: true, data: newData });
  } catch (error) {
    console.error('Error updating onboarding state:', error);
    return NextResponse.json(
      { error: 'Failed to update onboarding state' },
      { status: 500 }
    );
  }
}

// POST endpoint to reset onboarding state
export async function POST() {
  try {
    const defaultState = {
      steps: [
        {
          id: "create-profile",
          title: "Create Your Profile",
          description: "Create your business and user profile with JustPing.AI's intuitive tools.",
          completed: false,
          action: {
            text: "Go to Profile Page",
            link: "/profile"
          }
        },
        {
          id: "add-users",
          title: "Add Users",
          description: "Add users easily to your admin app and assign roles.",
          completed: false,
          action: {
            text: "Add User",
            link: "/team"
          }
        },
        {
          id: "create-first-agent",
          title: "Create Your First Agent",
          description: "Create your first agent powered by workflows and AI.",
          completed: false,
          action: {
            text: "Create Your Agent",
            link: "/agents/new"
          }
        },
        {
          id: "integrate-messaging",
          title: "Integrate Your Messaging Providers",
          description: "Integrate your preferred messaging providers.",
          completed: false,
          action: {
            text: "Go To Integrate Providers",
            link: "/integrations"
          }
        },
        {
          id: "create-data-aggregations",
          title: "Create Your First Data Aggregations",
          description: "Build comprehensive data hierarchies and attributes.",
          completed: false,
          action: {
            text: "Create Data Aggregation",
            link: "/aggregations/new"
          }
        },
        {
          id: "create-contact-group",
          title: "Create Your First Contact Group",
          description: "Easily group contacts to organize your data effectively.",
          completed: false,
          action: {
            text: "Create Contacts",
            link: "/contacts/groups/new"
          }
        },
        {
          id: "create-broadcast-template",
          title: "Create Your First Broadcast Template",
          description: "Use templates to broadcast messages to users.",
          completed: false,
          action: {
            text: "Create Broadcast",
            link: "/templates/new"
          }
        },
        {
          id: "launch-first-campaign",
          title: "Prepare and Launch Your First Campaign",
          description: "Select contact groups and launch targeted campaigns.",
          completed: false,
          action: {
            text: "Launch Campaign",
            link: "/campaigns/new"
          }
        },
        {
          id: "track-analyze-results",
          title: "Track Your Campaign and Analyze The Results",
          description: "Monitor campaign performance in real-time.",
          completed: false,
          action: {
            text: "Track Results",
            link: "/analytics"
          }
        }
      ],
      settings: {
        showWelcomeScreen: true,
        defaultScreen: "welcome",
        onboardingComplete: false
      },
      company: {},
      companyDetails: {},
      adminDetails: {},
      currentStep: "/onboarding/company"
    };
    
    // Ensure directory exists
    const dir = path.dirname(ONBOARDING_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    
    // Write default state
    await fs.writeFile(ONBOARDING_FILE_PATH, JSON.stringify(defaultState, null, 2));
    
    return NextResponse.json({ success: true, data: defaultState });
  } catch (error) {
    console.error('Error resetting onboarding state:', error);
    return NextResponse.json(
      { error: 'Failed to reset onboarding state' },
      { status: 500 }
    );
  }
}