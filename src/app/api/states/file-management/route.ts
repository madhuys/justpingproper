import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const STATE_FILE_PATH = path.join(process.cwd(), 'src/data/states/fileManagement.json');

export async function GET() {
  try {
    const data = await readFile(STATE_FILE_PATH, 'utf-8');
    const state = JSON.parse(data);
    return NextResponse.json(state);
  } catch (error) {
    console.error('Error reading file management state:', error);
    return NextResponse.json({ error: 'Failed to read state' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const currentData = await readFile(STATE_FILE_PATH, 'utf-8');
    const currentState = JSON.parse(currentData);
    
    // Merge the new state with the existing one
    const updatedState = {
      ...currentState,
      defaultState: {
        ...currentState.defaultState,
        ...body
      }
    };
    
    await writeFile(STATE_FILE_PATH, JSON.stringify(updatedState, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving file management state:', error);
    return NextResponse.json({ error: 'Failed to save state' }, { status: 500 });
  }
}