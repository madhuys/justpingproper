const BusinessUser = require("../../system/models/BusinessUser");
const Business = require("../../system/models/Business");
const Role = require("../../system/models/Role");
const TokenBlacklist = require("../../system/models/TokenBlacklist");
const { transaction } = require("objection");
const crypto = require("crypto");

/**
 * Repository for database operations related to authentication
 */

/**
 * Create a new business in the database
 * @param {Object} businessData - Business data
 * @param {Object} trx - Transaction object
 * @returns {Promise<Object>} Created business
 */
const createBusiness = async (businessData, trx) => {
  return Business.query(trx).insert({
    name: businessData.name,
    description: businessData.description || null,
    website: businessData.website || null,
    industry: businessData.industry || null,
    subscription_plan: "free",
    status: "active",
    contact_info: businessData.contact_info || {},
  });
};

/**
 * Create a new user in the database
 * @param {Object} userData - User data
 * @param {string} businessId - Business ID
 * @param {string} firebaseUid - Firebase UID
 * @param {Object} trx - Transaction object
 * @returns {Promise<Object>} Created user
 */
const createBusinessUser = async (userData, businessId, firebaseUid, trx) => {
  return BusinessUser.query(trx).insert({
    business_id: businessId,
    email: userData.email,
    firebase_uid: firebaseUid,
    first_name: userData.first_name,
    last_name: userData.last_name,
    status: "active",
    email_verified: false,
    metadata: {
      tokenVersion: 0,
    },
  });
};

/**
 * Get or create admin role for a business
 * @param {string} businessId - Business ID
 * @param {Object} trx - Transaction object
 * @returns {Promise<Object>} Admin role
 */
const getOrCreateAdminRole = async (businessId, trx) => {
  let adminRole = await Role.query(trx)
    .where({
      business_id: businessId,
      name: "Admin",
    })
    .first();

  if (!adminRole) {
    adminRole = await Role.query(trx).insert({
      business_id: businessId,
      name: "Admin",
      description: "Administrator with full access",
      permissions: {
        // Updated granular permissions
        users: { create: true, read: true, update: true, delete: true },
        roles: { create: true, read: true, update: true, delete: true },
        templates: { create: true, read: true, update: true, delete: true },
        broadcasts: { create: true, read: true, update: true, delete: true },
        campaigns: { create: true, read: true, update: true, delete: true },
        agents: {
          create: true,
          read: true,
          update: true,
          delete: true,
          approve: true,
        },
        contacts: { create: true, read: true, update: true, delete: true },
        business: { create: true, read: true, update: true, delete: true },
        settings: { create: true, read: true, update: true, delete: true },
        channels: { create: true, read: true, update: true, delete: true },
        business_channels: {
          create: true,
          read: true,
          update: true,
          delete: true,
        },
        integrations: { manage: true },
      },
    });
  }

  return adminRole;
};

/**
 * Assign role to user
 * @param {Object} user - User object
 * @param {string} roleId - Role ID
 * @param {Object} trx - Transaction object
 * @returns {Promise<void>}
 */
const assignRoleToUser = async (user, roleId, trx) => {
  return user.$relatedQuery("roles", trx).relate(roleId);
};

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object>} User object
 */
const getUserByEmail = async (email) => {
  return BusinessUser.query().where({ email }).first();
};

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object>} User object
 */
const getUserById = async (id) => {
  return BusinessUser.query().findById(id);
};

/**
 * Get user roles
 * @param {string} userId - User ID
 * @returns {Promise<Array>} User roles
 */
const getUserRoles = async (userId) => {
  const user = await BusinessUser.query()
    .findById(userId)
    .withGraphFetched("roles");

  if (!user) {
    return [];
  }

  return user.roles || [];
};

/**
 * Create password reset token
 * @param {string} userId - User ID
 * @param {Object} metadata - User metadata
 * @param {string} hashedToken - Hashed reset token
 * @param {string} resetTokenExpiry - Token expiry date ISO string
 * @returns {Promise<Object>} Updated user
 */
const savePasswordResetToken = async (
  userId,
  metadata,
  hashedToken,
  resetTokenExpiry
) => {
  return BusinessUser.query()
    .findById(userId)
    .patch({
      metadata: {
        ...metadata,
        resetToken: hashedToken,
        resetTokenExpiry: resetTokenExpiry,
      },
    });
};

/**
 * Find all users
 * @returns {Promise<Array>} All users
 */
const findAllUsers = async () => {
  return BusinessUser.query();
};

/**
 * Update user metadata after password reset
 * @param {string} userId - User ID
 * @param {Object} metadata - User metadata
 * @returns {Promise<void>}
 */
const updateUserMetadata = async (userId, metadata) => {
  return BusinessUser.query().findById(userId).patch({
    is_password_created: true,
    metadata,
  });
};

/**
 * Blacklist a token
 * @param {string} token - Token to blacklist
 * @param {Date} expiryDate - Token expiry date
 * @returns {Promise<Object>} Blacklisted token
 */
const blacklistToken = async (token, expiryDate) => {
  return TokenBlacklist.query().insert({
    token,
    expires_at: expiryDate.toISOString(),
  });
};

/**
 * Start a database transaction
 * @returns {Promise<Object>} Transaction object
 */
const startTransaction = async () => {
  return BusinessUser.startTransaction();
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
  return BusinessUser.query(trx)
    .findById(userId)
    .patch({
      is_password_created: false,
      metadata: {
        ...(userData.metadata || {}),
        resetToken,
        resetTokenExpiry: resetTokenExpiry.toISOString(),
      },
    });
};

/**
 * Get role with permissions
 * @param {string} roleId - Role ID
 * @returns {Promise<Object>} Role with permissions
 */
const getRoleWithPermissions = async (roleId) => {
  return Role.query()
    .findById(roleId)
    .select("id", "name", "description", "permissions");
};

/**
 * Get user with roles and permissions
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User with roles and permissions
 */
const getUserWithRolesAndPermissions = async (email) => {
  return BusinessUser.query()
    .findOne({ email: email })
    .withGraphFetched("roles");
};

/**
 * Validate business access for a user
 * @param {string} userId - User ID
 * @param {string} businessId - Business ID
 * @returns {Promise<boolean>} Whether user has access to business
 */
const validateBusinessAccess = async (userId, businessId) => {
  const user = await BusinessUser.query()
    .where("id", userId)
    .andWhere("business_id", businessId)
    .first();

  return !!user;
};

const findUserByResetToken = async (hashedToken) => {
  // Implementation depends on your database technology
  // Example for a generic database query:
  return await BusinessUser.query()
    .whereRaw("metadata->>'resetToken' = ?", [hashedToken])
    .whereRaw("metadata->>'resetTokenExpiry' > ?", [new Date().toISOString()])
    .first();
};

module.exports = {
  createBusiness,
  createBusinessUser,
  getOrCreateAdminRole,
  assignRoleToUser,
  getUserByEmail,
  getUserById,
  getUserRoles,
  savePasswordResetToken,
  findAllUsers,
  updateUserMetadata,
  blacklistToken,
  startTransaction,
  updateUserWithResetToken,
  getRoleWithPermissions,
  getUserWithRolesAndPermissions,
  validateBusinessAccess,
  findUserByResetToken,
};
