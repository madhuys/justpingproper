import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TEAM_FILE_PATH = path.join(process.cwd(), 'src/data/states/teamMembers.json');
const MOCK_FILE_PATH = path.join(process.cwd(), 'src/data/mocks/teamMembers.json');

// GET /api/team - Get team members
export async function GET(request: NextRequest) {
  try {
    // First try to read actual team data
    const fileContent = await fs.readFile(TEAM_FILE_PATH, 'utf-8');
    const teamData = JSON.parse(fileContent);
    
    // If empty, load mock data in development
    if ((!teamData.members || teamData.members.length === 0) && process.env.NODE_ENV === 'development') {
      try {
        const mockContent = await fs.readFile(MOCK_FILE_PATH, 'utf-8');
        const mockData = JSON.parse(mockContent);
        return NextResponse.json(mockData);
      } catch (mockError) {
        // Mock file doesn't exist, continue with empty data
      }
    }
    
    return NextResponse.json(teamData);
  } catch (error) {
    console.error('Team fetch error:', error);
    
    // Try to load mock data in development
    if (process.env.NODE_ENV === 'development') {
      try {
        const mockContent = await fs.readFile(MOCK_FILE_PATH, 'utf-8');
        const mockData = JSON.parse(mockContent);
        return NextResponse.json(mockData);
      } catch (mockError) {
        // Mock file doesn't exist either
      }
    }
    
    // If all fails, return empty members array
    return NextResponse.json({ 
      members: []
    });
  }
}

// POST /api/team - Invite team member
export async function POST(request: NextRequest) {
  try {
    const newMember = await request.json();
    
    // Read existing team data
    let teamData = { members: [] };
    try {
      const fileContent = await fs.readFile(TEAM_FILE_PATH, 'utf-8');
      teamData = JSON.parse(fileContent);
    } catch (error) {
      // File doesn't exist yet, use default
    }
    
    // Create new member with generated ID and metadata
    const memberWithId = {
      id: Date.now().toString(),
      ...newMember,
      status: 'invited',
      invitedAt: new Date().toISOString(),
      onboardingComplete: false
    };
    
    // Add new member to the array
    teamData.members.push(memberWithId);
    
    // Ensure the directory exists
    const dir = path.dirname(TEAM_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    
    // Write updated data to file
    await fs.writeFile(
      TEAM_FILE_PATH,
      JSON.stringify(teamData, null, 2),
      'utf-8'
    );
    
    return NextResponse.json({ 
      success: true,
      member: memberWithId 
    });
  } catch (error) {
    console.error('Team invite error:', error);
    return NextResponse.json(
      { error: 'Failed to invite team member' },
      { status: 500 }
    );
  }
}