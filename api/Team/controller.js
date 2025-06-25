const boom = require("@hapi/boom");
const teamService = require("./service");
const logger = require("../../system/utils/logger");

/**
 * List all teams for a business
 * @param {Object} req - Express request object
 */
const listTeams = async (req) => {
  try {
    const businessId = req.user.businessId;
    const filters = req.query;

    return await teamService.listTeams(businessId, filters);
  } catch (error) {
    logger.error("Error in listTeams controller:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to list teams");
  }
};

/**
 * Get team details by ID
 * @param {Object} req - Express request object
 */
const getTeamById = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { teamId } = req.params;

    return await teamService.getTeamById(teamId, businessId);
  } catch (error) {
    logger.error(
      `Error in getTeamById controller for team ${req.params.teamId}:`,
      error
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get team details");
  }
};

/**
 * Create a new team
 * @param {Object} req - Express request object
 */
const createTeam = async (req) => {
  try {
    const businessId = req.user.businessId;
    const teamData = req.body;

    const result = await teamService.createTeam(businessId, teamData);
    // For created resources, we can return the status code along with the result
    return { statusCode: 201, data: result };
  } catch (error) {
    logger.error("Error in createTeam controller:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to create team");
  }
};

/**
 * Update team details
 * @param {Object} req - Express request object
 */
const updateTeam = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { teamId } = req.params;
    const teamData = req.body;

    return await teamService.updateTeam(teamId, businessId, teamData);
  } catch (error) {
    logger.error(
      `Error in updateTeam controller for team ${req.params.teamId}:`,
      error
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to update team");
  }
};

/**
 * Delete/deactivate a team
 * @param {Object} req - Express request object
 */
const deleteTeam = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { teamId } = req.params;

    return await teamService.deleteTeam(teamId, businessId);
  } catch (error) {
    logger.error(
      `Error in deleteTeam controller for team ${req.params.teamId}:`,
      error
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to delete team");
  }
};

/**
 * List team members
 * @param {Object} req - Express request object
 */
const listTeamMembers = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { teamId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    return await teamService.listTeamMembers(teamId, businessId, page, limit);
  } catch (error) {
    logger.error(
      `Error in listTeamMembers controller for team ${req.params.teamId}:`,
      error
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to list team members");
  }
};

/**
 * Add members to a team
 * @param {Object} req - Express request object
 */
const addTeamMembers = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { teamId } = req.params;
    const { members } = req.body;

    const result = await teamService.addTeamMembers(
      teamId,
      businessId,
      members
    );
    return { statusCode: 201, data: result };
  } catch (error) {
    logger.error(
      `Error in addTeamMembers controller for team ${req.params.teamId}:`,
      error
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to add team members");
  }
};

/**
 * Remove a member from a team
 * @param {Object} req - Express request object
 */
const removeTeamMember = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { teamId, userId } = req.params;

    return await teamService.removeTeamMember(teamId, businessId, userId);
  } catch (error) {
    logger.error(
      `Error in removeTeamMember controller for team ${req.params.teamId} and user ${req.params.userId}:`,
      error
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to remove team member");
  }
};

/**
 * Update team member role
 * @param {Object} req - Express request object
 */
const updateTeamMemberRole = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { teamId, userId } = req.params;
    const { role } = req.body;

    return await teamService.updateTeamMemberRole(
      teamId,
      businessId,
      userId,
      role
    );
  } catch (error) {
    logger.error(
      `Error in updateTeamMemberRole controller for team ${req.params.teamId} and user ${req.params.userId}:`,
      error
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to update team member role");
  }
};

/**
 * Invite users to join a team
 * @param {Object} req - Express request object
 */
const inviteTeamMembers = async (req) => {
  try {
    const businessId = req.user.businessId;
    const inviterId = req.user.userId;
    const { teamId } = req.params;
    const { invitations } = req.body;

    const result = await teamService.inviteTeamMembers(
      teamId,
      businessId,
      inviterId,
      invitations
    );
    return { statusCode: 201, data: result };
  } catch (error) {
    logger.error(
      `Error in inviteTeamMembers controller for team ${req.params.teamId}:`,
      error
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to invite team members");
  }
};

/**
 * Revoke a user's invitation
 * @param {Object} req - Express request object
 */
const revokeTeamMemberInvitation = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { invitationId } = req.params;

    return await teamService.revokeTeamMemberInvitation(
      invitationId,
      businessId
    );
  } catch (error) {
    logger.error(
      `Error in revokeTeamMemberInvitation controller for invitation ${req.params.invitationId}:`,
      error
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to revoke team member invitation");
  }
};

module.exports = {
  listTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  listTeamMembers,
  addTeamMembers,
  removeTeamMember,
  updateTeamMemberRole,
  inviteTeamMembers,
  revokeTeamMemberInvitation,
};
