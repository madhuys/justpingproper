const Team = require("../../system/models/Team");
const TeamMember = require("../../system/models/TeamMember");
const BusinessUser = require("../../system/models/BusinessUser");
const BusinessUserInvitation = require("../../system/models/BusinessUserInvitation");
const Role = require("../../system/models/Role");
const logger = require("../../system/utils/logger");
const crypto = require("crypto");
/**
 * Repository for database operations related to teams
 */

/**
 * Get all teams for a business with filtering and pagination
 * @param {string} businessId - Business ID
 * @param {Object} filters - Filters and pagination options
 * @returns {Promise<Object>} - Teams with pagination info
 */
const getTeamsByBusinessId = async (businessId, filters) => {
  try {
    return await Team.findByBusinessId(businessId, filters);
  } catch (error) {
    logger.error("Error fetching teams:", error);
    throw error;
  }
};

/**
 * Get team by ID and business ID
 * @param {string} teamId - Team ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Team object
 */
const getTeamById = async (teamId, businessId) => {
  try {
    return await Team.findByIdAndBusinessId(teamId, businessId);
  } catch (error) {
    logger.error(`Error fetching team with ID ${teamId}:`, error);
    throw error;
  }
};

/**
 * Create a new team
 * @param {Object} teamData - Team data
 * @returns {Promise<Object>} - Created team
 */
const createTeam = async (teamData) => {
  try {
    return await Team.query().insert(teamData);
  } catch (error) {
    logger.error("Error creating team:", error);
    throw error;
  }
};

/**
 * Update team details
 * @param {string} teamId - Team ID
 * @param {Object} teamData - Updated team data
 * @returns {Promise<Object>} - Updated team
 */
const updateTeam = async (teamId, teamData) => {
  try {
    return await Team.query().patchAndFetchById(teamId, teamData);
  } catch (error) {
    logger.error(`Error updating team with ID ${teamId}:`, error);
    throw error;
  }
};

/**
 * Delete or deactivate a team
 * @param {string} teamId - Team ID
 * @returns {Promise<number>} - Number of affected rows
 */
const deleteTeam = async (teamId) => {
  try {
    // We'll just update the status to 'inactive' instead of deleting
    return await Team.query().findById(teamId).patch({ status: "inactive" });
  } catch (error) {
    logger.error(`Error deactivating team with ID ${teamId}:`, error);
    throw error;
  }
};

/**
 * Get team members with pagination
 * @param {string} teamId - Team ID
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @returns {Promise<Object>} - Team members with pagination info
 */
const getTeamMembers = async (teamId, page, limit) => {
  try {
    return await TeamMember.getMembersByTeamId(teamId, page, limit);
  } catch (error) {
    logger.error(`Error fetching members for team ${teamId}:`, error);
    throw error;
  }
};

/**
 * Check if user exists
 * @param {string} userId - User ID
 * @param {string} businessId - Business ID
 * @returns {Promise<boolean>} - Whether user exists
 */
const userExists = async (userId, businessId) => {
  try {
    const user = await BusinessUser.query()
      .where({
        id: userId,
        business_id: businessId,
      })
      .first();

    return !!user;
  } catch (error) {
    logger.error(`Error checking if user ${userId} exists:`, error);
    throw error;
  }
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User object or null if not found
 */
const getUserById = async (userId) => {
  try {
    return await BusinessUser.query().findById(userId);
  } catch (error) {
    logger.error(`Error getting user with ID ${userId}:`, error);
    throw error;
  }
};
/**
 * Add members to a team
 * @param {string} teamId - Team ID
 * @param {Array} members - Array of members to add
 * @returns {Promise<Array>} - Added members
 */
const addTeamMembers = async (teamId, members) => {
  try {
    const insertData = members.map((member) => ({
      team_id: teamId,
      user_id: member.user_id,
      role: member.role,
      created_at: new Date().toISOString(),
    }));

    return await TeamMember.query().insert(insertData).returning("*");
  } catch (error) {
    logger.error(`Error adding members to team ${teamId}:`, error);
    throw error;
  }
};

/**
 * Remove a member from a team
 * @param {string} teamId - Team ID
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of deleted rows
 */
const removeTeamMember = async (teamId, userId) => {
  try {
    return await TeamMember.query()
      .where({
        team_id: teamId,
        user_id: userId,
      })
      .delete();
  } catch (error) {
    logger.error(`Error removing user ${userId} from team ${teamId}:`, error);
    throw error;
  }
};

/**
 * Update team member role
 * @param {string} teamId - Team ID
 * @param {string} userId - User ID
 * @param {string} role - New role
 * @returns {Promise<Object>} - Updated member
 */
const updateTeamMemberRole = async (teamId, userId, role) => {
  try {
    return await TeamMember.query()
      .where({
        team_id: teamId,
        user_id: userId,
      })
      .patch({
        role,
        updated_at: new Date().toISOString(),
      })
      .returning("*");
  } catch (error) {
    logger.error(
      `Error updating role for user ${userId} in team ${teamId}:`,
      error
    );
    throw error;
  }
};

/**
 * Check if a team member exists
 * @param {string} teamId - Team ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Whether member exists
 */
const teamMemberExists = async (teamId, userId) => {
  try {
    const member = await TeamMember.findTeamMember(teamId, userId);
    return !!member;
  } catch (error) {
    logger.error(
      `Error checking if user ${userId} is in team ${teamId}:`,
      error
    );
    throw error;
  }
};

/**
 * Get role by name and business ID
 * @param {string} roleName - Role name
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Role object
 */
const getRoleByName = async (roleName, businessId) => {
  try {
    return await Role.query()
      .where({
        name: roleName,
        business_id: businessId,
      })
      .first();
  } catch (error) {
    logger.error(
      `Error getting role ${roleName} for business ${businessId}:`,
      error
    );
    throw error;
  }
};

/**
 * Create user invitation
 * @param {Object} invitationData - Invitation data
 * @returns {Promise<Object>} - Created invitation
 */
const createUserInvitation = async (invitationData) => {
  try {
    // Generate a unique token
    const token = crypto.randomBytes(32).toString("hex");

    // Set expiration date (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create the invitation
    return await BusinessUserInvitation.query().insert({
      ...invitationData,
      token,
      expires_at: expiresAt.toISOString(),
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(
      `Error creating invitation for ${invitationData.email}:`,
      error
    );
    throw error;
  }
};

/**
 * Check if user invitation exists
 * @param {string} email - User email
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Existing invitation or null
 */
const findPendingInvitation = async (email, businessId) => {
  try {
    return await BusinessUserInvitation.findPendingInvitation(
      email,
      businessId
    );
  } catch (error) {
    logger.error(`Error checking invitation for ${email}:`, error);
    throw error;
  }
};

/**
 * Revoke user invitation
 * @param {string} invitationId - Invitation ID
 * @returns {Promise<number>} - Number of updated rows
 */
const revokeUserInvitation = async (invitationId) => {
  try {
    return await BusinessUserInvitation.query().findById(invitationId).patch({
      status: "revoked",
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Error revoking invitation ${invitationId}:`, error);
    throw error;
  }
};

/**
 * Get user invitations by team role
 * @param {string} businessId - Business ID
 * @param {string} teamRoleName - Team role name
 * @returns {Promise<Array>} - List of invitations
 */
const getUserInvitationsForTeamRole = async (businessId, teamRoleName) => {
  try {
    return await BusinessUserInvitation.query()
      .where({
        business_id: businessId,
        status: "pending",
      })
      .withGraphFetched("[role]")
      .modifyGraph("role", (builder) => {
        builder.where("name", teamRoleName);
      });
  } catch (error) {
    logger.error(
      `Error getting invitations for team role ${teamRoleName}:`,
      error
    );
    throw error;
  }
};

module.exports = {
  getTeamsByBusinessId,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  userExists,
  getUserById,
  addTeamMembers,
  removeTeamMember,
  updateTeamMemberRole,
  teamMemberExists,
  getRoleByName,
  createUserInvitation,
  findPendingInvitation,
  revokeUserInvitation,
  getUserInvitationsForTeamRole,
};
