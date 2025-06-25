const express = require("express");
const router = express.Router();
const teamController = require("./controller");
const { validateRequest } = require("../../system/middleware/validate-request");
const { verifyToken, hasPermission } = require("../../system/middleware/auth");
const schema = require("./schema");
const controllerHandler = require("../../system/utils/controller-handler");

// All routes require authentication
router.use(verifyToken);

// List all teams
router.get(
  "/",
  hasPermission("teams.read"),
  validateRequest(schema.listTeamsQuerySchema),
  controllerHandler(teamController.listTeams, (req) => [req])
);

// Get team details
router.get(
  "/:teamId",
  hasPermission("teams.read"),
  controllerHandler(teamController.getTeamById, (req) => [req])
);

// Create team
router.post(
  "/",
  hasPermission("teams.create"),
  validateRequest(schema.teamSchema),
  controllerHandler(teamController.createTeam, (req) => [req])
);

// Update team
router.put(
  "/:teamId",
  hasPermission("teams.update"),
  validateRequest(schema.teamSchema),
  controllerHandler(teamController.updateTeam, (req) => [req])
);

// Delete/deactivate team
router.delete(
  "/:teamId",
  hasPermission("teams.delete"),
  controllerHandler(teamController.deleteTeam, (req) => [req])
);

// List team members
router.get(
  "/:teamId/members",
  hasPermission("teams.read"),
  validateRequest(schema.listTeamMembersQuerySchema),
  controllerHandler(teamController.listTeamMembers, (req) => [req])
);

// Add team members
router.post(
  "/:teamId/members",
  hasPermission("teams.update"),
  validateRequest(schema.addTeamMembersSchema),
  controllerHandler(teamController.addTeamMembers, (req) => [req])
);

// Remove team member
router.delete(
  "/:teamId/members/:userId",
  hasPermission("teams.update"),
  controllerHandler(teamController.removeTeamMember, (req) => [req])
);

// Update team member role
router.put(
  "/:teamId/members/:userId/role",
  hasPermission("teams.update"),
  validateRequest(schema.updateTeamMemberRoleSchema),
  controllerHandler(teamController.updateTeamMemberRole, (req) => [req])
);

// Invite new team members
router.post(
  "/:teamId/invitations",
  hasPermission("teams.update"),
  validateRequest(schema.inviteTeamMembersSchema),
  controllerHandler(teamController.inviteTeamMembers, (req) => [req])
);

// Revoke team member invitation
router.delete(
  "/invitations/:invitationId",
  hasPermission("teams.update"),
  controllerHandler(teamController.revokeTeamMemberInvitation, (req) => [req])
);

module.exports = router;
