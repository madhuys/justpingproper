import { NextRequest, NextResponse } from 'next/server';

// Import backend controller
const authController = require('../../../../../server/controllers/authController');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.business || !body.user) {
      return NextResponse.json(
        { error: 'Business and user data are required' },
        { status: 400 }
      );
    }

    const result = await authController.registerUser(body);

    return NextResponse.json({
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    console.error('Registration API error:', error);
    
    if (error.isBoom) {
      return NextResponse.json(
        { error: error.message },
        { status: error.output.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}