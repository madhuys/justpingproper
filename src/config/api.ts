/**
 * API Configuration
 * 
 * Central configuration for API endpoints and settings
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    // Auth endpoints
    auth: {
      login: `${API_BASE_URL}/api/auth/login`,
      register: `${API_BASE_URL}/api/auth/register`,
      logout: `${API_BASE_URL}/api/auth/logout`,
      refresh: `${API_BASE_URL}/api/auth/refresh`,
      forgotPassword: `${API_BASE_URL}/api/auth/forgot-password`,
      resetPassword: `${API_BASE_URL}/api/auth/reset-password`,
      verifyEmail: `${API_BASE_URL}/api/auth/verify-email`,
      google: `${API_BASE_URL}/api/auth/google`,
      microsoft: `${API_BASE_URL}/api/auth/microsoft`,
    },
    
    // User endpoints
    users: `${API_BASE_URL}/api/users`,
    
    // Business endpoints
    business: `${API_BASE_URL}/api/business`,
    businessOnboarding: `${API_BASE_URL}/api/business/onboarding`,
    businessDocuments: `${API_BASE_URL}/api/business/documents`,
    
    // Team endpoints (legacy)
    team: `${API_BASE_URL}/api/team`,
    
    // Users endpoints
    users: `${API_BASE_URL}/api/users`,
    
    // Settings endpoints
    settings: {
      user: `${API_BASE_URL}/api/settings/user`,
      business: `${API_BASE_URL}/api/settings/business`,
      businessLogo: `${API_BASE_URL}/api/settings/business/logo`,
    }
  },
  
  // Default headers
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
  
  // Get auth headers
  getAuthHeaders: () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
  
  // Full headers including auth
  getHeaders: () => ({
    ...apiConfig.defaultHeaders,
    ...apiConfig.getAuthHeaders(),
  }),
};

export default apiConfig;