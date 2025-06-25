import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function getAuthToken(request: NextRequest): Promise<string | null> {
  // Try to get token from cookie first
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get('authToken')?.value;
  
  if (tokenFromCookie) {
    return tokenFromCookie;
  }
  
  // Fallback to Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

export function createAuthHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
}