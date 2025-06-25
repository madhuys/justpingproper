import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TEAM_FILE_PATH = path.join(process.cwd(), 'src/data/states/teamMembers.json');

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT /api/team/[id] - Update team member
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const updates = await request.json();
    
    // Read existing team data
    const fileContent = await fs.readFile(TEAM_FILE_PATH, 'utf-8');
    const teamData = JSON.parse(fileContent);
    
    // Find and update the member
    const memberIndex = teamData.members.findIndex((m: any) => m.id === params.id);
    if (memberIndex === -1) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }
    
    teamData.members[memberIndex] = {
      ...teamData.members[memberIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Write updated data back to file
    await fs.writeFile(
      TEAM_FILE_PATH,
      JSON.stringify(teamData, null, 2),
      'utf-8'
    );
    
    return NextResponse.json({ 
      success: true,
      member: teamData.members[memberIndex]
    });
  } catch (error) {
    console.error('Team update error:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

// DELETE /api/team/[id] - Remove team member
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Read existing team data
    const fileContent = await fs.readFile(TEAM_FILE_PATH, 'utf-8');
    const teamData = JSON.parse(fileContent);
    
    // Filter out the member to be removed
    const updatedMembers = teamData.members.filter((m: any) => m.id !== params.id);
    
    if (updatedMembers.length === teamData.members.length) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }
    
    teamData.members = updatedMembers;
    
    // Write updated data back to file
    await fs.writeFile(
      TEAM_FILE_PATH,
      JSON.stringify(teamData, null, 2),
      'utf-8'
    );
    
    return NextResponse.json({ 
      success: true,
      message: 'Team member removed successfully' 
    });
  } catch (error) {
    console.error('Team remove error:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}