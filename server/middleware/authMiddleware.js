const jwt = require('jsonwebtoken');
const config = require('../../system/config/config');
const boom = require('@hapi/boom');

/**
 * Extract and verify JWT token from Next.js request
 * @param {NextRequest} request - Next.js request object
 * @returns {Object} Decoded user data
 */
const extractUserFromRequest = (request) => {
  try {
    // Get token from cookie
    const authToken = request.cookies.get('authToken')?.value;
    
    if (!authToken) {
      throw boom.unauthorized('No authentication token provided');
    }

    // Verify and decode token
    const decoded = jwt.verify(authToken, config.jwt.secret);
    
    if (!decoded || !decoded.userId || !decoded.businessId) {
      throw boom.unauthorized('Invalid authentication token');
    }

    return {
      userId: decoded.userId,
      businessId: decoded.businessId,
      email: decoded.email,
      roles: decoded.roles || [],
      permissions: decoded.permissions || {},
      firebaseUid: decoded.firebaseUid,
      metadata: decoded.metadata || {}
    };
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    
    if (error.name === 'TokenExpiredError') {
      throw boom.unauthorized('Authentication token has expired');
    }
    
    if (error.name === 'JsonWebTokenError') {
      throw boom.unauthorized('Invalid authentication token');
    }
    
    throw boom.unauthorized('Authentication failed');
  }
};

/**
 * Middleware function for Next.js API routes to extract user
 * @param {NextRequest} request - Next.js request object
 * @returns {Object} User data
 */
const authenticate = (request) => {
  return extractUserFromRequest(request);
};

module.exports = {
  extractUserFromRequest,
  authenticate,
};