import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowPath = path.join(
      process.cwd(),
      'src/data/states/workflows',
      `${params.id}.json`
    );
    
    const data = await fs.readFile(workflowPath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json(
      { error: 'Workflow not found' },
      { status: 404 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflow = await request.json();
    const workflowPath = path.join(
      process.cwd(),
      'src/data/states/workflows',
      `${params.id}.json`
    );
    
    // Ensure directory exists
    const dir = path.dirname(workflowPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Save workflow
    await fs.writeFile(
      workflowPath,
      JSON.stringify(workflow, null, 2),
      'utf8'
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save workflow' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowPath = path.join(
      process.cwd(),
      'src/data/states/workflows',
      `${params.id}.json`
    );
    
    await fs.unlink(workflowPath);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}