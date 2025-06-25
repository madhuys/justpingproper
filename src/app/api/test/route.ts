import { NextRequest, NextResponse } from 'next/server';

// Example GET handler
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'API routes are working correctly!',
    timestamp: new Date().toISOString(),
  });
}

// Example POST handler with formData
export async function POST(request: NextRequest) {
  try {
    // Check content type
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData
      const formData = await request.formData();
      const name = formData.get('name') as string;
      const file = formData.get('file') as File;
      
      return NextResponse.json({
        message: 'FormData received',
        name,
        fileName: file?.name,
        fileSize: file?.size,
      });
    } else {
      // Handle JSON
      const body = await request.json();
      return NextResponse.json({
        message: 'JSON data received',
        data: body,
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}