const jwt = require("jsonwebtoken");
const boom = require("@hapi/boom");
const { query } = require("../db/postgres");
const config = require("../config/config");
const logger = require("../utils/logger");
const firebaseAdmin = require("../config/firebase");
const BusinessUser = require("../models/BusinessUser");
const crypto = require("crypto");

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
  try {
    // Skip for development if configured
    if (
      process.env.NODE_ENV === "development" &&
      process.env.SKIP_AUTH_CHECK === "true"
    ) {
      console.log("Skipping auth check in development mode");
      req.user = {
        userId: "dev-user-123",
        businessId: "dev-business-123",
        email: "dev@example.com",
        roles: ["Super Admin"],
        firebaseUid: "dev-firebase-uid",
      };
      return next();
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw boom.unauthorized("Authentication token required");
    }

    const token = authHeader.split(" ")[1];

    // Add request tracking
    req.requestId = crypto.randomUUID();

    // // Add token rotation check
    // if (config.api.security.tokenRotation) {
    //   const isRotated = await checkTokenRotation(token);
    //   if (isRotated) {
    //     throw boom.unauthorized("Token has been rotated");
    //   }
    // }

    // Check if it's a Firebase token
    if (authHeader.startsWith("Bearer Firebase ")) {
      // Verify Firebase token
      const decodedFirebaseToken = await firebaseAdmin
        .auth()
        .verifyIdToken(token);

      // Find user in our system with this Firebase UID
      const user = await BusinessUser.query()
        .select(
          "business_user.id",
          "business_user.business_id",
          "business_user.email",
          "business_user.firebase_uid",
        )
        .where("business_user.firebase_uid", decodedFirebaseToken.uid)
        .first();

      if (!user) {
        throw boom.unauthorized("User not found in system");
      }

      // Get user roles from our database
      const rolesResult = await query(
        `SELECT r.name
         FROM business_user_role bur
         JOIN role r ON bur.role_id = r.id
         WHERE bur.user_id = $1`,
        [user.id],
      );

      const roles = rolesResult.rows.map((r) => r.name);

      // Attach user info to request
      req.user = {
        userId: user.id,
        businessId: user.business_id,
        email: user.email,
        roles: roles,
        firebaseUid: user.firebase_uid,
      };

      return next();
    } // Otherwise, check our custom JWT
    // Check if token is blacklisted
    let blacklistResult;
    try {
      blacklistResult = await query(
        "SELECT id FROM token_blacklist WHERE token = $1",
        [token],
      );
    } catch (dbError) {
      logger.error("Database error during token blacklist check:", dbError);
      // If database is unavailable, we can choose to either:
      // 1. Fail securely (reject the request) - more secure
      // 2. Allow through (risk of allowing blacklisted tokens) - more available
      // For security, we'll fail securely
      throw boom.serviceUnavailable(
        "Authentication service temporarily unavailable",
      );
    }

    if (blacklistResult.rows.length > 0) {
      throw boom.unauthorized("Token has been invalidated");
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Save user data in request object
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(boom.unauthorized("Token expired"));
    }
    if (error.name === "JsonWebTokenError") {
      return next(boom.unauthorized("Invalid token"));
    }
    if (error.isBoom) {
      return next(error);
    }

    logger.error(`Auth error [${req.requestId}]:`, error);
    return next(boom.unauthorized("Authentication failed"));
  }
};

// system/middleware/auth.js
// In the existing file, we can enhance the hasPermission function to check roles

// This function returns middleware that checks if a user has a specific permission
const hasPermission = (permission) => {
  return async (req, res, next) => {
    // Skip for development if configured
    if (
      process.env.NODE_ENV === "development" &&
      process.env.SKIP_PERMISSION_CHECK === "true"
    ) {
      console.log("Skipping permission check in development mode");
      return next();
    }
    if (!req.user || !req.user.userId) {
      return next(boom.forbidden("Access denied: No user information"));
    }

    // Check if permissions are directly in the token
    if (req.user.permissions) {
      // Parse permission format like "module.action" (e.g., "users.read")
      const [module, action] = permission.split(".");

      if (
        req.user.permissions[module] &&
        req.user.permissions[module][action] === true
      ) {
        return next();
      }

      return next(
        boom.forbidden(`Access denied: Missing '${permission}' permission`),
      );
    }

    // If permissions not in token, fall back to database check
    const permissionsResult = await query(
      `SELECT r.permissions
       FROM business_user_role bur
       JOIN role r ON bur.role_id = r.id
       WHERE bur.user_id = $1`,
      [req.user.userId],
    );

    console.log("Permissions Result:", permissionsResult.rows);

    // Combine all permissions from different roles
    const permissions = {};
    permissionsResult.rows.forEach((row) => {
      const perms =
        typeof row.permissions === "string"
          ? JSON.parse(row.permissions)
          : row.permissions;

      Object.keys(perms).forEach((key) => {
        if (perms[key] === true) {
          permissions[key] = true;
        }
      });
    });

    // Check for the specific permission
    if (!permissions[permission]) {
      return next(
        boom.forbidden(`Access denied: Missing '${permission}' permission`),
      );
    }

    next();
  };
};

// Check if user has a specific role
const hasRole = (roleName) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return next(boom.forbidden("Access denied: No roles"));
    }

    // Handle both array of strings and array of objects formats for roles
    let hasRequiredRole = false;

    if (Array.isArray(req.user.roles)) {
      if (typeof req.user.roles[0] === "string") {
        // Handle array of strings format
        hasRequiredRole = req.user.roles.includes(roleName);
      } else if (typeof req.user.roles[0] === "object") {
        // Handle array of objects format with name property
        hasRequiredRole = req.user.roles.some((role) => role.name === roleName);
      }
    }

    if (!hasRequiredRole) {
      return next(boom.forbidden(`Access denied: Missing '${roleName}' role`));
    }

    next();
  };
};

module.exports = {
  verifyToken,
  hasPermission,
  hasRole,
};
