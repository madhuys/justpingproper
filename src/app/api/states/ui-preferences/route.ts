import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const UI_PREFERENCES_PATH = path.join(process.cwd(), 'src/data/states/ui-preferences.json');

export async function GET() {
  try {
    const data = await fs.readFile(UI_PREFERENCES_PATH, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    // Return default preferences if file doesn't exist
    return NextResponse.json({
      theme: 'system',
      notificationsPaneWidth: 280,
      conversationsDateRange: 7,
      expandedSections: {
        quickConnect: true,
        conversations: true
      },
      pinnedItems: [],
      preferredChannelView: 'all',
      contentExpanded: false
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const preferences = await request.json();
    
    // Ensure the directory exists
    const dir = path.dirname(UI_PREFERENCES_PATH);
    await fs.mkdir(dir, { recursive: true });
    
    // Write the preferences
    await fs.writeFile(UI_PREFERENCES_PATH, JSON.stringify(preferences, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save UI preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}