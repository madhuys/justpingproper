import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;
    
    // Validate category to prevent directory traversal
    const validCategories = ['auth', 'onboarding', 'navigation', 'dashboard', 'common'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid content category' },
        { status: 400 }
      );
    }

    // Read the JSON file
    const filePath = path.join(process.cwd(), 'src', 'data', 'strings', `${category}.json`);
    
    try {
      const fileContents = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(fileContents);
      
      return NextResponse.json(data);
    } catch (error) {
      // If file doesn't exist, return empty object
      return NextResponse.json({});
    }
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// GET specific key from category
export async function POST(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const { category } = params;
    const { keys } = await request.json();
    
    // Validate category
    const validCategories = ['auth', 'onboarding', 'navigation', 'dashboard', 'common'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid content category' },
        { status: 400 }
      );
    }

    // Read the JSON file
    const filePath = path.join(process.cwd(), 'src', 'data', 'strings', `${category}.json`);
    
    try {
      const fileContents = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(fileContents);
      
      // If keys are specified, return only those keys
      if (keys && Array.isArray(keys)) {
        const filteredData: any = {};
        keys.forEach(key => {
          if (data[key]) {
            filteredData[key] = data[key];
          }
        });
        return NextResponse.json(filteredData);
      }
      
      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({});
    }
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}