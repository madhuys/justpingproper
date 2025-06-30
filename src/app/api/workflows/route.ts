import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const WORKFLOWS_DIR = path.join(process.cwd(), 'src', 'data', 'states', 'workflows');

// Ensure the workflows directory exists
async function ensureWorkflowsDir() {
  try {
    await fs.access(WORKFLOWS_DIR);
  } catch {
    await fs.mkdir(WORKFLOWS_DIR, { recursive: true });
  }
}

// GET /api/workflows - List all saved workflows
export async function GET() {
  try {
    await ensureWorkflowsDir();
    
    const files = await fs.readdir(WORKFLOWS_DIR);
    const workflows = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(WORKFLOWS_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const workflow = JSON.parse(content);
        workflows.push({
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
        });
      }
    }
    
    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Error reading workflows:', error);
    return NextResponse.json({ error: 'Failed to read workflows' }, { status: 500 });
  }
}