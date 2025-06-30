import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TEMP_WORKFLOW_PATH = path.join(process.cwd(), 'src/data/states/tempWorkflow.json');

export async function GET() {
  try {
    const data = await fs.readFile(TEMP_WORKFLOW_PATH, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading temp workflow:', error);
    return NextResponse.json({
      name: '',
      description: '',
      nodes: [],
      edges: [],
      selectedNodeId: null,
      lastSaved: null
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const workflow = await request.json();
    await fs.writeFile(TEMP_WORKFLOW_PATH, JSON.stringify(workflow, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving temp workflow:', error);
    return NextResponse.json({ error: 'Failed to save workflow' }, { status: 500 });
  }
}