import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// GET all available content categories
export async function GET() {
  try {
    const stringsDir = path.join(process.cwd(), 'src', 'data', 'strings');
    
    try {
      const files = await fs.readdir(stringsDir);
      const categories = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
      
      return NextResponse.json({ categories });
    } catch (error) {
      // If directory doesn't exist, return empty array
      return NextResponse.json({ categories: [] });
    }
  } catch (error) {
    console.error('Error listing content categories:', error);
    return NextResponse.json(
      { error: 'Failed to list content categories' },
      { status: 500 }
    );
  }
}

// POST to get multiple categories at once
export async function POST(request: NextRequest) {
  try {
    const { categories } = await request.json();
    
    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'Categories must be an array' },
        { status: 400 }
      );
    }
    
    const result: any = {};
    
    for (const category of categories) {
      const filePath = path.join(process.cwd(), 'src', 'data', 'strings', `${category}.json`);
      
      try {
        const fileContents = await fs.readFile(filePath, 'utf8');
        result[category] = JSON.parse(fileContents);
      } catch (error) {
        // If file doesn't exist, skip it
        result[category] = null;
      }
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching multiple categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}