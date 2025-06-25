import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

// Define onboarding routes
const onboardingRoutes = ['/onboarding'];

// In-memory cache for user states (in production, use Redis or similar)
const userStateCache: Record<string, any> = {};

// Track if user has completed onboarding
const userOnboardingStatus: Record<string, boolean> = {};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if the path is a public route
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

  // Get the auth token from cookies
  const authToken = request.cookies.get('auth-token');

  // If trying to access a protected route without auth, redirect to login
  if (!isPublicRoute && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If authenticated and trying to access auth pages, redirect appropriately
  if (isPublicRoute && authToken && path !== '/forgot-password' && path !== '/reset-password') {
    const userId = authToken.value;
    
    // Check if user has completed onboarding
    if (!userOnboardingStatus[userId]) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    } else {
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  // Handle root path for authenticated users
  if (path === '/' && authToken) {
    const userId = authToken.value;
    
    // Check if user has completed onboarding
    if (!userOnboardingStatus[userId]) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    
    const cacheKey = `${userId}_welcome`;
    const showWelcome = userStateCache[cacheKey] !== false;
    
    if (showWelcome) {
      return NextResponse.redirect(new URL('/home', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // Handle onboarding completion
  if (authToken && path === '/onboarding' && request.method === 'POST') {
    const userId = authToken.value;
    userOnboardingStatus[userId] = true;
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images/).*)',
  ],
};