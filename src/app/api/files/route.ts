import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getMimeType } from '@/lib/file-utils';

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  mimeType?: string;
  size?: number;
  path: string;
  modifiedAt: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
  children?: FileItem[];
}

async function scanDirectory(dirPath: string, basePath: string): Promise<FileItem[]> {
  const items: FileItem[] = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(basePath, fullPath);
      const stats = await fs.stat(fullPath);
      
      if (entry.isDirectory()) {
        const children = await scanDirectory(fullPath, basePath);
        items.push({
          id: relativePath.replace(/\\/g, '/'),
          name: entry.name,
          type: 'folder',
          path: '/' + relativePath.replace(/\\/g, '/'),
          modifiedAt: stats.mtime.toISOString(),
          children
        });
      } else {
        const mimeType = getMimeType(entry.name);
        const publicPath = '/test-docs/' + relativePath.replace(/\\/g, '/');
        
        items.push({
          id: relativePath.replace(/\\/g, '/'),
          name: entry.name,
          type: 'file',
          mimeType,
          size: stats.size,
          path: '/' + relativePath.replace(/\\/g, '/'),
          modifiedAt: stats.mtime.toISOString(),
          downloadUrl: publicPath,
          thumbnailUrl: mimeType?.startsWith('image/') ? publicPath : undefined
        });
      }
    }
  } catch (error) {
    console.error('Error scanning directory:', error);
  }
  
  return items;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const requestPath = searchParams.get('path') || '/';
  
  // Base directory for test docs
  const baseDir = path.join(process.cwd(), 'public', 'test-docs');
  
  try {
    // Ensure the path is safe and within bounds
    const resolvedPath = path.resolve(baseDir, requestPath.replace(/^\//, ''));
    if (!resolvedPath.startsWith(baseDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }
    
    const files = await scanDirectory(resolvedPath, baseDir);
    
    return NextResponse.json({
      path: requestPath,
      files
    });
  } catch (error) {
    console.error('Error reading files:', error);
    return NextResponse.json({ error: 'Failed to read files' }, { status: 500 });
  }
}