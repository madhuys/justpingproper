const Role = require("../../system/models/Role");
const BusinessUser = require("../../system/models/BusinessUser");
const { transaction } = require("objection");
const logger = require("../../system/utils/logger");

/**
 * Find roles by business ID with pagination
 * @param {string} businessId - Business ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated roles
 */
const findByBusinessId = async (businessId, page = 1, limit = 20) => {
  try {
    return await Role.findByBusinessId(businessId, page, limit);
  } catch (error) {
    logger.error(`Error finding roles for business ${businessId}:`, error);
    throw error;
  }
};

/**
 * Find a role by ID and business ID
 * @param {string} id - Role ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Role object
 */
const findById = async (id, businessId) => {
  try {
    return await Role.query()
      .findById(id)
      .where("business_id", businessId)
      .first();
  } catch (error) {
    logger.error(`Error finding role by ID ${id}:`, error);
    throw error;
  }
};

/**
 * Find a role by name and business ID
 * @param {string} name - Role name
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Role object
 */
const findByName = async (name, businessId) => {
  try {
    return await Role.query()
      .where({
        name: name,
        business_id: businessId,
      })
      .first();
  } catch (error) {
    logger.error(`Error finding role by name ${name}:`, error);
    throw error;
  }
};

/**
 * Create a new role
 * @param {Object} roleData - Role data
 * @returns {Promise<Object>} Created role
 */
const create = async (roleData) => {
  try {
    const { name, description, permissions, business_id } = roleData;

    return await Role.query().insert({
      name,
      description,
      permissions,
      business_id,
    });
  } catch (error) {
    logger.error("Error creating role:", error);
    throw error;
  }
};

/**
 * Update an existing role
 * @param {string} id - Role ID
 * @param {Object} roleData - Updated role data
 * @returns {Promise<Object>} Updated role
 */
const update = async (id, roleData) => {
  try {
    const { name, description, permissions } = roleData;

    // Update only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (permissions !== undefined) updateData.permissions = permissions;

    return await Role.query()
      .patchAndFetchById(id, updateData)
      .throwIfNotFound();
  } catch (error) {
    logger.error(`Error updating role ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a role
 * @param {string} id - Role ID
 * @returns {Promise<void>}
 */
const remove = async (id) => {
  try {
    await Role.query().deleteById(id).throwIfNotFound();
  } catch (error) {
    logger.error(`Error deleting role ${id}:`, error);
    throw error;
  }
};

/**
 * Find a user by ID and business ID
 * @param {string} id - User ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} User object
 */
const findUserById = async (id, businessId) => {
  try {
    return await BusinessUser.query()
      .findById(id)
      .where("business_id", businessId)
      .first();
  } catch (error) {
    logger.error(`Error finding user by ID ${id}:`, error);
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
    const result = await BusinessUser.knex().raw(
      `
      SELECT COUNT(*) FROM business_user_role
      WHERE user_id = ? AND role_id = ?
      `,
      [userId, roleId]
    );

    // Extract count from query result (the structure depends on the database)
    const count = parseInt(result.rows[0].count, 10);
    return count > 0;
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
    await BusinessUser.knex().raw(
      `
      INSERT INTO business_user_role (user_id, role_id, created_at)
      VALUES (?, ?, NOW())
      `,
      [userId, roleId]
    );
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
    await BusinessUser.knex().raw(
      `
      DELETE FROM business_user_role
      WHERE user_id = ? AND role_id = ?
      `,
      [userId, roleId]
    );
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
    const roles = await Role.query()
      .select("role.*")
      .join("business_user_role", "role.id", "=", "business_user_role.role_id")
      .where("business_user_role.user_id", userId);

    return roles;
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
  // Use a transaction to ensure atomicity
  const trx = await transaction.start(BusinessUser.knex());

  try {
    // Remove all existing roles
    await trx.raw(
      `
      DELETE FROM business_user_role
      WHERE user_id = ?
      `,
      [userId]
    );

    // Add new roles
    if (roleIds.length > 0) {
      const values = roleIds
        .map((roleId) => `('${userId}', '${roleId}', NOW())`)
        .join(", ");

      await trx.raw(
        `
        INSERT INTO business_user_role (user_id, role_id, created_at)
        VALUES ${values}
        `
      );
    }

    await trx.commit();
  } catch (error) {
    await trx.rollback();
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
    const users = await BusinessUser.query()
      .select("business_user.*")
      .join(
        "business_user_role",
        "business_user.id",
        "=",
        "business_user_role.user_id"
      )
      .where("business_user_role.role_id", roleId);

    return users;
  } catch (error) {
    logger.error(`Error getting users for role ${roleId}:`, error);
    throw error;
  }
};

module.exports = {
  findByBusinessId,
  findById,
  findByName,
  create,
  update,
  remove,
  findUserById,
  isRoleAssignedToUser,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
  updateUserRoles,
  getRoleUsers,
};
