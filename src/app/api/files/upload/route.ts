import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = path.extname(file.name);
    const filename = `${timestamp}-${random}${ext}`;
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Save to public/workflow-files directory
    const uploadDir = path.join(process.cwd(), 'public', 'workflow-files');
    const filePath = path.join(uploadDir, filename);
    
    await writeFile(filePath, buffer);
    
    // Return file info
    return NextResponse.json({
      id: `file-${timestamp}-${random}`,
      name: file.name,
      url: `/workflow-files/${filename}`,
      type: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}