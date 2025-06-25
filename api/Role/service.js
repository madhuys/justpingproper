const repository = require("./repository");
const logger = require("../../system/utils/logger");

/**
 * Get all roles for a business with pagination
 * @param {string} businessId - Business ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated roles
 */
const getRoles = async (businessId, page = 1, limit = 20) => {
  try {
    return await repository.findByBusinessId(businessId, page, limit);
  } catch (error) {
    logger.error("Error getting roles:", error);
    throw error;
  }
};

/**
 * Get a role by ID
 * @param {string} roleId - Role ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Role object
 */
const getRoleById = async (roleId, businessId) => {
  try {
    return await repository.findById(roleId, businessId);
  } catch (error) {
    logger.error(`Error getting role by ID ${roleId}:`, error);
    throw error;
  }
};

/**
 * Get a role by name
 * @param {string} name - Role name
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Role object
 */
const getRoleByName = async (name, businessId) => {
  try {
    return await repository.findByName(name, businessId);
  } catch (error) {
    logger.error(`Error getting role by name ${name}:`, error);
    throw error;
  }
};

/**
 * Create a new role
 * @param {Object} roleData - Role data
 * @returns {Promise<Object>} Created role
 */
const createRole = async (roleData) => {
  try {
    return await repository.create(roleData);
  } catch (error) {
    logger.error("Error creating role:", error);
    throw error;
  }
};

/**
 * Update an existing role
 * @param {string} roleId - Role ID
 * @param {Object} roleData - Updated role data
 * @returns {Promise<Object>} Updated role
 */
const updateRole = async (roleId, roleData) => {
  try {
    return await repository.update(roleId, roleData);
  } catch (error) {
    logger.error(`Error updating role ${roleId}:`, error);
    throw error;
  }
};

/**
 * Delete a role
 * @param {string} roleId - Role ID
 * @returns {Promise<void>}
 */
const deleteRole = async (roleId) => {
  try {
    return await repository.remove(roleId);
  } catch (error) {
    logger.error(`Error deleting role ${roleId}:`, error);
    throw error;
  }
};

/**
 * Get a user by ID
 * @param {string} userId - User ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} User object
 */
const getUserById = async (userId, businessId) => {
  try {
    return await repository.findUserById(userId, businessId);
  } catch (error) {
    logger.error(`Error getting user by ID ${userId}:`, error);
    throw error;
  }
};

/**
 * Check if a role is assigned to a user
 * @param {string} userId - User ID
 * @param {string} roleId - Role ID
 * @returns {Promise<boolean>} Whether the role is assigned to the user
 */
const isRoleAssignedToUser = async (userId, roleId) => {
  try {
    return await repository.isRoleAssignedToUser(userId, roleId);
  } catch (error) {
    logger.error(
      `Error checking if role ${roleId} is assigned to user ${userId}:`,
      error
    );
    throw error;
  }
};

/**
 * Assign a role to a user
 * @param {string} userId - User ID
 * @param {string} roleId - Role ID
 * @returns {Promise<void>}
 */
const assignRoleToUser = async (userId, roleId) => {
  try {
    return await repository.assignRoleToUser(userId, roleId);
  } catch (error) {
    logger.error(`Error assigning role ${roleId} to user ${userId}:`, error);
    throw error;
  }
};

/**
 * Remove a role from a user
 * @param {string} userId - User ID
 * @param {string} roleId - Role ID
 * @returns {Promise<void>}
 */
const removeRoleFromUser = async (userId, roleId) => {
  try {
    return await repository.removeRoleFromUser(userId, roleId);
  } catch (error) {
    logger.error(`Error removing role ${roleId} from user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get roles assigned to a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of roles
 */
const getUserRoles = async (userId) => {
  try {
    return await repository.getUserRoles(userId);
  } catch (error) {
    logger.error(`Error getting roles for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Update roles assigned to a user (replace all roles)
 * @param {string} userId - User ID
 * @param {Array<string>} roleIds - Array of role IDs
 * @returns {Promise<void>}
 */
const updateUserRoles = async (userId, roleIds) => {
  try {
    return await repository.updateUserRoles(userId, roleIds);
  } catch (error) {
    logger.error(`Error updating roles for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get users assigned to a role
 * @param {string} roleId - Role ID
 * @returns {Promise<Array>} Array of users
 */
const getRoleUsers = async (roleId) => {
  try {
    return await repository.getRoleUsers(roleId);
  } catch (error) {
    logger.error(`Error getting users for role ${roleId}:`, error);
    throw error;
  }
};

module.exports = {
  getRoles,
  getRoleById,
  getRoleByName,
  createRole,
  updateRole,
  deleteRole,
  getUserById,
  isRoleAssignedToUser,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
  updateUserRoles,
  getRoleUsers,
};
