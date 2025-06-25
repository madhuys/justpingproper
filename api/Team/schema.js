const Joi = require("joi");

// Schema for team query parameters
const listTeamsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid("active", "inactive"),
  search: Joi.string().trim().allow(""),
  sort_by: Joi.string().valid("name", "created_at", "updated_at"),
  sort_order: Joi.string().valid("asc", "desc").default("asc"),
});

// Schema for team creation and update
const teamSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(500).allow("", null),
  status: Joi.string().valid("active", "inactive").default("active"),
  metadata: Joi.object().unknown(true),
});

// Schema for team members query parameters
const listTeamMembersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Schema for adding existing team members
const addTeamMembersSchema = Joi.object({
  members: Joi.array()
    .items(
      Joi.object({
        user_id: Joi.string().uuid().required(),
        role: Joi.string()
          .valid("member", "supervisor", "team_lead", "agent")
          .required(),
        // Optional fields for creating new users
        create_user: Joi.object({
          email: Joi.string().email().required(),
          first_name: Joi.string().required(),
          last_name: Joi.string().required(),
          status: Joi.string().valid("active", "inactive").default("active"),
        }).optional(),
        send_invitation: Joi.boolean().default(false),
        invited_by: Joi.string().uuid().optional(),
      })
    )
    .min(1)
    .required(),
});

// Schema for updating team member role
const updateTeamMemberRoleSchema = Joi.object({
  role: Joi.string()
    .valid("member", "supervisor", "team_lead", "agent")
    .required(),
});

// Schema for inviting new team members
const inviteTeamMembersSchema = Joi.object({
  invitations: Joi.array()
    .items(
      Joi.object({
        email: Joi.string().email().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        role: Joi.string()
          .valid("member", "supervisor", "team_lead", "agent")
          .required(),
      })
    )
    .min(1)
    .required(),
});

module.exports = {
  listTeamsQuerySchema,
  teamSchema,
  listTeamMembersQuerySchema,
  addTeamMembersSchema,
  updateTeamMemberRoleSchema,
  inviteTeamMembersSchema,
};
