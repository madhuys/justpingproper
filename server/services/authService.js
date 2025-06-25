const boom = require("@hapi/boom");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");
const config = require("../../system/config/config");
const firebase = require("../../system/config/firebase");
const logger = require("../../system/utils/logger");
const repository = require("../../api/Auth/repository");

const createBusiness = async (businessData, trx) => {
  return repository.createBusiness(businessData, trx);
};

const createFirebaseUser = async (userData) => {
  return firebase.admin.auth().createUser({
    email: userData.email,
    password: userData.password,
    displayName: `${userData.first_name} ${userData.last_name}`,
  });
};

const createFirebasePasswordRestLink = async (email) => {
  return firebase.admin.auth().generatePasswordResetLink(email);
};

const createBusinessUser = async (userData, businessId, firebaseUid, trx) => {
  return repository.createBusinessUser(userData, businessId, firebaseUid, trx);
};

const getOrCreateAdminRole = async (businessId, trx) => {
  return repository.getOrCreateAdminRole(businessId, trx);
};

const assignRoleToUser = async (user, roleId, trx) => {
  return repository.assignRoleToUser(user, roleId, trx);
};

const getUserByEmail = async (email) => {
  return repository.getUserByEmail(email);
};

const getUserById = async (id) => {
  return repository.getUserById(id);
};

const getUserRoles = async (userId) => {
  return repository.getUserRoles(userId);
};

const createPasswordResetToken = async (email) => {
  const user = await repository.getUserByEmail(email);

  if (!user) {
    return { success: false };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const resetTokenExpiry = new Date();
  resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry

  await repository.savePasswordResetToken(
    user.id,
    user.metadata,
    hashedToken,
    resetTokenExpiry.toISOString()
  );

  return { success: true, token: resetToken, user }; // Return unhashed version
};

/**
 * Find user by reset token
 * @param {string} token - Reset token
 * @returns {Promise<Object>} User object
 */
const findUserByResetToken = async (token) => {
  try {
    if (!token || typeof token !== "string") {
      return null;
    }

    return await repository.findUserByResetToken(token);
  } catch (error) {
    console.error("Error finding user by reset token:", error);
    return null;
  }
};

/**
 * Update user password in Firebase
 * @param {string} firebaseUid - Firebase UID
 * @param {string} password - New password
 * @returns {Promise<void>}
 */
const updateFirebaseUserPassword = async (firebaseUid, password) => {
  return firebase.admin.auth().updateUser(firebaseUid, {
    password,
  });
};

/**
 * Update user metadata after password reset
 * @param {string} userId - User ID
 * @param {Object} metadata - User metadata
 * @returns {Promise<void>}
 */
const updateUserMetadata = async (userId, metadata) => {
  return repository.updateUserMetadata(userId, metadata);
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @param {boolean} ignoreExpiration - Whether to ignore expiration
 * @returns {Promise<Object>} Decoded token
 */
const verifyJwtToken = async (token, ignoreExpiration = false) => {
  return jwt.verify(token, config.jwt.secret, {
    ignoreExpiration,
  });
};

/**
 * Blacklist a token
 * @param {string} token - Token to blacklist
 * @param {Date} expiryDate - Token expiry date
 * @returns {Promise<Object>} Blacklisted token
 */
const blacklistToken = async (token, expiryDate) => {
  return repository.blacklistToken(token, expiryDate);
};

/**
 * Authenticate with Firebase
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Firebase auth response
 */
const authenticateWithFirebase = async (email, password) => {
  try {
    if (!firebase.apiKey) {
      throw new Error("Firebase API key is not configured");
    }

    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebase.apiKey}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );

    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(
        `Firebase authentication failed: ${error.response.data.error.message}`
      );
    }
    throw new Error(`Firebase authentication failed: ${error.message}`);
  }
};

/**
 * Start a database transaction
 * @returns {Promise<Object>} Transaction object
 */
const startTransaction = async () => {
  return repository.startTransaction();
};

/**
 * Update user with password reset token
 * @param {string} userId - User ID
 * @param {Object} userData - User data object
 * @param {string} resetToken - Reset token
 * @param {Date} resetTokenExpiry - Token expiry date
 * @param {Object} trx - Transaction object
 * @returns {Promise<void>}
 */
const updateUserWithResetToken = async (
  userId,
  userData,
  resetToken,
  resetTokenExpiry,
  trx
) => {
  return repository.updateUserWithResetToken(
    userId,
    userData,
    resetToken,
    resetTokenExpiry,
    trx
  );
};

/**
 * Get role with permissions
 * @param {string} roleId - Role ID
 * @returns {Promise<Object>} Role with permissions
 */
const getRoleWithPermissions = async (roleId) => {
  return repository.getRoleWithPermissions(roleId);
};

/**
 * Get user with roles and permissions
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User with roles and permissions
 */
const getUserWithRolesAndPermissions = async (email) => {
  const user = await repository.getUserWithRolesAndPermissions(email);

  if (!user) return null;

  // Combine permissions from all roles
  let combinedPermissions = {};
  if (user.roles) {
    user.roles.forEach((role) => {
      if (role.permissions) {
        Object.entries(role.permissions).forEach(([key, value]) => {
          // If any role has true for a permission, set it to true
          combinedPermissions[key] = combinedPermissions[key] || value;
        });
      }
    });
  }

  return {
    ...user,
    combinedPermissions,
  };
};

/**
 * Validate business access for a user
 * @param {string} userId - User ID
 * @param {string} businessId - Business ID
 * @returns {Promise<boolean>} Whether user has access to business
 */
const validateBusinessAccess = async (userId, businessId) => {
  return repository.validateBusinessAccess(userId, businessId);
};

module.exports = {
  createBusiness,
  createFirebaseUser,
  createBusinessUser,
  getOrCreateAdminRole,
  assignRoleToUser,
  getUserByEmail,
  getUserById,
  getUserRoles,
  createPasswordResetToken,
  findUserByResetToken,
  updateFirebaseUserPassword,
  updateUserMetadata,
  verifyJwtToken,
  blacklistToken,
  authenticateWithFirebase,
  startTransaction,
  updateUserWithResetToken,
  getRoleWithPermissions,
  getUserWithRolesAndPermissions,
  validateBusinessAccess,
  createFirebasePasswordRestLink,
};