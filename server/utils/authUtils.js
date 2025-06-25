const jwt = require("jsonwebtoken");
const config = require("../../system/config/config");
const firebaseAdmin = require("../../system/config/firebase");
const logger = require("../../system/utils/logger");
const axios = require("axios");

/**
 * Generate JWT tokens for a user
 * @param {Object} user - User object
 * @param {Array} roles - User roles
 * @param {Object} permissions - User permissions
 * @returns {Object} Object with access token, refresh token, and expiry
 */
const generateJWT = (user, roles, permissions) => {
  // Access token payload with enhanced role information
  const payload = {
    userId: user.id,
    businessId: user.business_id,
    email: user.email,
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
    })),
    permissions: permissions || {},
    firebaseUid: user.firebase_uid,
    metadata: {
      firstName: user.first_name,
      lastName: user.last_name,
      status: user.status,
      isOnboarded: user.is_onboarded,
    },
  };

  // Generate access token
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn,
  });

  // Generate refresh token with just enough info for security
  const refreshToken = jwt.sign(
    {
      userId: user.id,
      type: "refresh",
      tokenVersion: user.metadata?.tokenVersion || 0,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  // Parse expiry time from the config value (e.g., "1h" -> 3600)
  let expiresIn;
  const match = config.jwt.accessExpiresIn.match(/(\d+)([smhd])/);
  if (match) {
    const [, value, unit] = match;
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    expiresIn = parseInt(value) * multipliers[unit];
  } else {
    expiresIn = 3600; // Default 1 hour if parsing fails
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
  };
};

/**
 * Verify Firebase ID token
 * @param {string} idToken - Firebase ID token
 * @returns {Promise<Object>} Decoded token payload
 */
const verifyFirebaseToken = async (idToken) => {
  try {
    if (!idToken || typeof idToken !== "string" || idToken.trim() === "") {
      throw new Error("Invalid token format: Token is empty or not a string");
    }

    // Check if the token has the correct format (typically starts with "eyJ")
    if (!idToken.startsWith("eyJ")) {
      throw new Error(
        "Invalid token format: Token does not appear to be a valid JWT"
      );
    }

    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    logger.error(`Firebase token verification failed: ${error.message}`);
    throw new Error(`Firebase token verification failed: ${error.message}`);
  }
};

/**
 * Authenticate with Firebase using email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Firebase auth response
 */
const authenticateWithFirebase = async (email, password) => {
  try {
    // This is a simplified version - in production, you'd use the Firebase Auth REST API
    // https://firebase.google.com/docs/reference/rest/auth
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${config.firebase.apiKey}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(`Firebase authentication failed: ${error.message}`);
  }
};

/**
 * Validate password against security requirements
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and errors
 */
const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  generateJWT,
  verifyFirebaseToken,
  authenticateWithFirebase,
  validatePassword,
};