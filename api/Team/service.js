const boom = require("@hapi/boom");
const repository = require("./repository");
const logger = require("../../system/utils/logger");
const emailService = require("../../system/services/Email");

/**
 * List all teams for a business
 * @param {string} businessId - Business ID
 * @param {Object} filters - Query filters and pagination
 * @returns {Promise<Object>} Teams with pagination
 */
const listTeams = async (businessId, filters) => {
  try {
    const result = await repository.getTeamsByBusinessId(businessId, filters);
    return {
      status: "success",
      data: {
        teams: result.teams,
        pagination: result.pagination,
      },
    };
  } catch (error) {
    logger.error("Error listing teams:", error);
    throw error;
  }
};

/**
 * Get team details by ID
 * @param {string} teamId - Team ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Team details
 */
const getTeamById = async (teamId, businessId) => {
  try {
    const team = await repository.getTeamById(teamId, businessId);

    if (!team) {
      throw boom.notFound("Team not found", { code: "TEAM_NOT_FOUND" });
    }

    return {
      status: "success",
      data: {
        team,
      },
    };
  } catch (error) {
    logger.error(`Error getting team ${teamId}:`, error);
    throw error;
  }
};

/**
 * Create a new team
 * @param {string} businessId - Business ID
 * @param {Object} teamData - Team data
 * @returns {Promise<Object>} Created team
 */
const createTeam = async (businessId, teamData) => {
  try {
    // Add business ID to team data
    const data = {
      ...teamData,
      business_id: businessId,
      status: teamData.status || "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const team = await repository.createTeam(data);

    return {
      status: "success",
      data: {
        team,
      },
    };
  } catch (error) {
    // Check for unique constraint violation
    if (
      error.code === "23505" &&
      error.constraint === "team_business_id_name_key"
    ) {
      throw boom.conflict("A team with this name already exists", {
        code: "TEAM_NAME_EXISTS",
      });
    }

    logger.error("Error creating team:", error);
    throw error;
  }
};

/**
 * Update team details
 * @param {string} teamId - Team ID
 * @param {string} businessId - Business ID
 * @param {Object} teamData - Updated team data
 * @returns {Promise<Object>} Updated team
 */
const updateTeam = async (teamId, businessId, teamData) => {
  try {
    // Check if team exists
    const existingTeam = await repository.getTeamById(teamId, businessId);

    if (!existingTeam) {
      throw boom.notFound("Team not found", { code: "TEAM_NOT_FOUND" });
    }

    // Update team
    const data = {
      ...teamData,
      updated_at: new Date().toISOString(),
    };

    const team = await repository.updateTeam(teamId, data);

    return {
      status: "success",
      data: {
        team,
      },
    };
  } catch (error) {
    // Check for unique constraint violation
    if (
      error.code === "23505" &&
      error.constraint === "team_business_id_name_key"
    ) {
      throw boom.conflict("A team with this name already exists", {
        code: "TEAM_NAME_EXISTS",
      });
    }

    logger.error(`Error updating team ${teamId}:`, error);
    throw error;
  }
};

/**
 * Delete/deactivate a team
 * @param {string} teamId - Team ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Success message
 */
const deleteTeam = async (teamId, businessId) => {
  try {
    // Check if team exists
    const existingTeam = await repository.getTeamById(teamId, businessId);

    if (!existingTeam) {
      throw boom.notFound("Team not found", { code: "TEAM_NOT_FOUND" });
    }

    // Deactivate team (soft delete)
    await repository.deleteTeam(teamId);

    return {
      status: "success",
      message: "Team deactivated successfully",
    };
  } catch (error) {
    logger.error(`Error deleting team ${teamId}:`, error);
    throw error;
  }
};

/**
 * List team members
 * @param {string} teamId - Team ID
 * @param {string} businessId - Business ID
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @returns {Promise<Object>} Team members with pagination
 */
const listTeamMembers = async (teamId, businessId, page, limit) => {
  try {
    // Check if team exists
    const existingTeam = await repository.getTeamById(teamId, businessId);

    if (!existingTeam) {
      throw boom.notFound("Team not found", { code: "TEAM_NOT_FOUND" });
    }

    const result = await repository.getTeamMembers(teamId, page, limit);

    return {
      status: "success",
      data: {
        members: result.members,
        pagination: result.pagination,
      },
    };
  } catch (error) {
    logger.error(`Error listing members for team ${teamId}:`, error);
    throw error;
  }
};

/**
 * Add members to a team
 * @param {string} teamId - Team ID
 * @param {string} businessId - Business ID
 * @param {Array} members - Members to add
 * @returns {Promise<Object>} - Success response
 */
const addTeamMembers = async (teamId, businessId, members) => {
  try {
    // Check if team exists
    const existingTeam = await repository.getTeamById(teamId, businessId);

    if (!existingTeam) {
      throw boom.notFound("Team not found", { code: "TEAM_NOT_FOUND" });
    }

    const results = {
      added: [],
      failed: [],
    };

    for (const member of members) {
      try {
        // Check if user exists in business
        let user = await repository.getUserById(member.user_id);

        if (!user) {
          // If user doesn't exist and we have create_user details, create the user
          if (member.create_user) {
            // Validate required fields
            if (
              !member.create_user.email ||
              !member.create_user.first_name ||
              !member.create_user.last_name
            ) {
              results.failed.push({
                user_id: member.user_id,
                reason:
                  "Missing required user information (email, first_name, last_name)",
              });
              continue;
            }

            // Create new business user
            user = await BusinessUser.query().insert({
              id: member.user_id, // Use provided ID if specified
              business_id: businessId,
              email: member.create_user.email,
              first_name: member.create_user.first_name,
              last_name: member.create_user.last_name,
              status: "active",
              email_verified: false,
              is_onboarded: false,
              is_reminder: true, // Mark as requiring reminder
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              metadata: {
                invited_to_team: teamId,
                invitation_date: new Date().toISOString(),
              },
            });
          } else {
            results.failed.push({
              user_id: member.user_id,
              reason: "User not found",
            });
            continue;
          }
        } else if (user.business_id !== businessId) {
          // Ensure user belongs to this business
          results.failed.push({
            user_id: member.user_id,
            reason: "User does not belong to this business",
          });
          continue;
        }

        // Check if user is already a team member
        const isMember = await repository.teamMemberExists(teamId, user.id);

        if (isMember) {
          results.failed.push({
            user_id: user.id,
            reason: "User is already a member of this team",
          });
          continue;
        }

        // Add user to team
        await repository.addTeamMembers(teamId, [
          {
            user_id: user.id,
            role: member.role,
          },
        ]);

        // If user was newly created and we have send_invitation flag set to true
        if (member.create_user && member.send_invitation) {
          // Create invitation token
          const token = crypto.randomBytes(32).toString("hex");
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);

          // Get the role ID for the team role
          const roleData = await repository.getRoleByName(
            member.role,
            businessId
          );

          // Create an invitation record
          const invitation = await repository.createUserInvitation({
            business_id: businessId,
            email: user.email,
            invited_by: member.invited_by || null, // Use provided inviter or null
            role_id: roleData ? roleData.id : null,
            token: token,
            expires_at: expiresAt.toISOString(),
          });

          // Send invitation email
          await sendInvitationEmail(
            user.email,
            user.first_name,
            user.last_name,
            member.role,
            token,
            existingTeam.name
          );

          results.added.push({
            user_id: user.id,
            invitation_sent: true,
            invitation_id: invitation.id,
          });
        } else {
          results.added.push({
            user_id: user.id,
            invitation_sent: false,
          });
        }
      } catch (error) {
        logger.error(
          `Error adding member ${member.user_id} to team ${teamId}:`,
          error
        );
        results.failed.push({
          user_id: member.user_id,
          reason: "Internal error processing request",
        });
      }
    }

    return {
      status: "success",
      data: {
        team_id: teamId,
        results,
      },
    };
  } catch (error) {
    logger.error(`Error adding members to team ${teamId}:`, error);
    throw error;
  }
};
/**
 * Remove a member from a team
 * @param {string} teamId - Team ID
 * @param {string} businessId - Business ID
 * @param {string} userId - User ID to remove
 * @returns {Promise<Object>} Success response
 */
const removeTeamMember = async (teamId, businessId, userId) => {
  try {
    // Check if team exists
    const existingTeam = await repository.getTeamById(teamId, businessId);

    if (!existingTeam) {
      throw boom.notFound("Team not found", { code: "TEAM_NOT_FOUND" });
    }

    // Check if user is a team member
    const isMember = await repository.teamMemberExists(teamId, userId);

    if (!isMember) {
      throw boom.notFound("User is not a member of this team", {
        code: "TEAM_MEMBER_NOT_FOUND",
      });
    }

    // Remove member
    await repository.removeTeamMember(teamId, userId);

    return {
      status: "success",
      message: "Team member removed successfully",
    };
  } catch (error) {
    logger.error(`Error removing user ${userId} from team ${teamId}:`, error);
    throw error;
  }
};

/**
 * Update team member role
 * @param {string} teamId - Team ID
 * @param {string} businessId - Business ID
 * @param {string} userId - User ID
 * @param {string} role - New role
 * @returns {Promise<Object>} Updated member info
 */
const updateTeamMemberRole = async (teamId, businessId, userId, role) => {
  try {
    // Check if team exists
    const existingTeam = await repository.getTeamById(teamId, businessId);

    if (!existingTeam) {
      throw boom.notFound("Team not found", { code: "TEAM_NOT_FOUND" });
    }

    // Check if user is a team member
    const isMember = await repository.teamMemberExists(teamId, userId);

    if (!isMember) {
      throw boom.notFound("User is not a member of this team", {
        code: "TEAM_MEMBER_NOT_FOUND",
      });
    }

    // Update role
    await repository.updateTeamMemberRole(teamId, userId, role);

    // Get updated user info
    const userInfo = await repository.userExists(userId, businessId);

    return {
      status: "success",
      data: {
        user_id: userId,
        role,
        ...userInfo,
      },
    };
  } catch (error) {
    logger.error(
      `Error updating role for user ${userId} in team ${teamId}:`,
      error
    );
    throw error;
  }
};

/**
 * Invite users to join a team
 * @param {string} teamId - Team ID
 * @param {string} businessId - Business ID
 * @param {string} inviterId - User ID of the inviter
 * @param {Array} invitations - Array of invitation data
 * @returns {Promise<Object>} - Response with successful and failed invitations
 */
const inviteTeamMembers = async (
  teamId,
  businessId,
  inviterId,
  invitations
) => {
  try {
    // Check if team exists
    const existingTeam = await repository.getTeamById(teamId, businessId);

    if (!existingTeam) {
      throw boom.notFound("Team not found", { code: "TEAM_NOT_FOUND" });
    }

    const results = {
      successful: [],
      failed: [],
    };

    // Process each invitation
    for (const invitation of invitations) {
      try {
        // Check if user is already invited
        const existingInvitation = await repository.findPendingInvitation(
          invitation.email,
          businessId
        );

        if (existingInvitation) {
          results.failed.push({
            email: invitation.email,
            reason: "User already has a pending invitation",
          });
          continue;
        }

        // Get the appropriate role based on team role
        const roleData = await repository.getRoleByName(
          invitation.role,
          businessId
        );

        if (!roleData) {
          results.failed.push({
            email: invitation.email,
            reason: `Role '${invitation.role}' not found`,
          });
          continue;
        }

        // Create the invitation
        const newInvitation = await repository.createUserInvitation({
          business_id: businessId,
          email: invitation.email,
          invited_by: inviterId,
          role_id: roleData.id,
        });

        // Send invitation email
        await sendInvitationEmail(
          invitation.email,
          invitation.firstName,
          invitation.lastName,
          invitation.role,
          newInvitation.token,
          existingTeam.name
        );

        results.successful.push({
          email: invitation.email,
          invitation_id: newInvitation.id,
        });
      } catch (error) {
        logger.error(
          `Error inviting ${invitation.email} to team ${teamId}:`,
          error
        );
        results.failed.push({
          email: invitation.email,
          reason: "Internal error processing invitation",
        });
      }
    }

    return {
      status: "success",
      data: {
        team_id: teamId,
        invitations: results,
      },
    };
  } catch (error) {
    logger.error(`Error inviting members to team ${teamId}:`, error);
    throw error;
  }
};

/**
 * Revoke a user's invitation
 * @param {string} invitationId - Invitation ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Success response
 */
const revokeTeamMemberInvitation = async (invitationId, businessId) => {
  try {
    // Find the invitation
    const invitation = await repository.BusinessUserInvitation.query()
      .findById(invitationId)
      .where("business_id", businessId)
      .first();

    if (!invitation) {
      throw boom.notFound("Invitation not found", {
        code: "INVITATION_NOT_FOUND",
      });
    }

    if (invitation.status !== "pending") {
      throw boom.badRequest("Invitation cannot be revoked", {
        code: "INVALID_INVITATION_STATUS",
      });
    }

    // Revoke the invitation
    await repository.revokeUserInvitation(invitationId);

    return {
      status: "success",
      message: "Invitation successfully revoked",
    };
  } catch (error) {
    logger.error(`Error revoking invitation ${invitationId}:`, error);
    throw error;
  }
};

/**
 * Send invitation email to user
 * @param {string} email - User email
 * @param {string} firstName - User first name
 * @param {string} lastName - User last name
 * @param {string} role - User role
 * @param {string} token - Invitation token
 * @param {string} teamName - Team name
 * @returns {Promise<void>}
 */
const sendInvitationEmail = async (
  email,
  firstName,
  lastName,
  role,
  token,
  teamName
) => {
  try {
    const invitationLink = `${process.env.FRONTEND_URL}/set-password?token=${token}`;

    await emailService.sendEmail({
      to: email,
      subject: "Welcome to JustPing.ai - Join Your Team!",
      templateName: "team-invitation",
      variables: {
        firstName: firstName,
        lastName: lastName,
        role: role,
        teamName: teamName,
        invitationLink: invitationLink,
        year: new Date().getFullYear(),
      },
    });

    logger.info(`Invitation email sent to ${email}`);
  } catch (error) {
    logger.error(`Error sending invitation email to ${email}:`, error);
    // We'll continue even if email fails - the invitation is still created
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
  sendInvitationEmail,
};
