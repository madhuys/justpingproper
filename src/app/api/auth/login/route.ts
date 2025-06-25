import { NextRequest, NextResponse } from 'next/server';

// Import backend controller
const authController = require('../../../../../server/controllers/authController');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await authController.loginUser({ email, password });

    // Create response with auth token in cookie
    const res = NextResponse.json({
      user: result.data.user,
      message: result.message,
    });

    // Set auth token as httpOnly cookie
    if (result.data.access_token) {
      res.cookies.set('authToken', result.data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: result.data.expires_in,
      });
    }

    return res;
  } catch (error: any) {
    console.error('Login API error:', error);
    
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