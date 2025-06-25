import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

// In-memory storage for user-specific states (in production, use database)
const userStates: Record<string, any> = {};

export async function GET(
  request: NextRequest,
  { params }: { params: { state: string } }
) {
  try {
    const { state } = params;
    
    // Get user identifier from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth-token')?.value || 'anonymous';
    
    // Validate state name
    const validStates = ['onboarding', 'businessProfile'];
    if (!validStates.includes(state)) {
      return NextResponse.json(
        { error: 'Invalid state name' },
        { status: 400 }
      );
    }

    // Check if user has custom state
    const userStateKey = `${userId}_${state}`;
    if (userStates[userStateKey]) {
      return NextResponse.json(userStates[userStateKey]);
    }

    // Read the default state file
    const filePath = path.join(process.cwd(), 'src', 'data', 'states', `${state}.json`);
    
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
    console.error('Error fetching state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch state' },
      { status: 500 }
    );
  }
}

// Update state
export async function PUT(
  request: NextRequest,
  { params }: { params: { state: string } }
) {
  try {
    const { state } = params;
    const updates = await request.json();
    
    // Get user identifier from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth-token')?.value || 'anonymous';
    
    // Validate state name
    const validStates = ['onboarding', 'businessProfile'];
    if (!validStates.includes(state)) {
      return NextResponse.json(
        { error: 'Invalid state name' },
        { status: 400 }
      );
    }

    const userStateKey = `${userId}_${state}`;
    
    // Get current state or load default
    if (!userStates[userStateKey]) {
      const filePath = path.join(process.cwd(), 'src', 'data', 'states', `${state}.json`);
      try {
        const fileContents = await fs.readFile(filePath, 'utf8');
        userStates[userStateKey] = JSON.parse(fileContents);
      } catch (error) {
        userStates[userStateKey] = {};
      }
    }
    
    // Update state
    userStates[userStateKey] = {
      ...userStates[userStateKey],
      ...updates
    };
    
    return NextResponse.json(userStates[userStateKey]);
  } catch (error) {
    console.error('Error updating state:', error);
    return NextResponse.json(
      { error: 'Failed to update state' },
      { status: 500 }
    );
  }
}

// Update specific step completion
export async function PATCH(
  request: NextRequest,
  { params }: { params: { state: string } }
) {
  try {
    const { state } = params;
    const { stepId, completed } = await request.json();
    
    // Get user identifier from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth-token')?.value || 'anonymous';
    
    const userStateKey = `${userId}_${state}`;
    
    // Get current state
    if (!userStates[userStateKey]) {
      const filePath = path.join(process.cwd(), 'src', 'data', 'states', `${state}.json`);
      const fileContents = await fs.readFile(filePath, 'utf8');
      userStates[userStateKey] = JSON.parse(fileContents);
    }
    
    // Update step completion
    const stepIndex = userStates[userStateKey].steps.findIndex((s: any) => s.id === stepId);
    if (stepIndex !== -1) {
      userStates[userStateKey].steps[stepIndex].completed = completed;
      
      // Check if all steps are completed
      const allCompleted = userStates[userStateKey].steps.every((s: any) => s.completed);
      userStates[userStateKey].settings.onboardingComplete = allCompleted;
    }
    
    return NextResponse.json(userStates[userStateKey]);
  } catch (error) {
    console.error('Error updating step:', error);
    return NextResponse.json(
      { error: 'Failed to update step' },
      { status: 500 }
    );
  }
}