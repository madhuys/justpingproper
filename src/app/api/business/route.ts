import { NextRequest, NextResponse } from 'next/server';

// Import backend controller and middleware
const businessController = require('../../../../server/controllers/businessController');
const { authenticate } = require('../../../../server/middleware/authMiddleware');

// GET /api/business - Get business profile
export async function GET(request: NextRequest) {
  try {
    const user = authenticate(request);
    const result = await businessController.getBusinessProfile(user.userId, user.businessId);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Business fetch error:', error);
    
    if (error.isBoom) {
      return NextResponse.json(
        { error: error.message },
        { status: error.output.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch business' },
      { status: 500 }
    );
  }
}

// POST /api/business - Create/Update business profile
export async function POST(request: NextRequest) {
  try {
    const user = authenticate(request);
    const body = await request.json();
    
    const result = await businessController.updateBusinessProfile(user.userId, user.businessId, body);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Business update error:', error);
    
    if (error.isBoom) {
      return NextResponse.json(
        { error: error.message },
        { status: error.output.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update business' },
      { status: 500 }
    );
  }
}

// PUT /api/business - Update business profile
export async function PUT(request: NextRequest) {
  try {
    const user = authenticate(request);
    const body = await request.json();
    
    const result = await businessController.updateBusinessProfile(user.userId, user.businessId, body);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Business update error:', error);
    
    if (error.isBoom) {
      return NextResponse.json(
        { error: error.message },
        { status: error.output.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update business' },
      { status: 500 }
    );
  }
}