// system/models/TeamMember.js
const BaseModel = require("./BaseModel");

class TeamMember extends BaseModel {
  static get tableName() {
    return "team_member";
  }

  static get idColumn() {
    return ["team_id", "user_id"];
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["team_id", "user_id"],
      properties: {
        team_id: { type: "string", format: "uuid" },
        user_id: { type: "string", format: "uuid" },
        role: {
          type: "string",
          enum: ["member", "supervisor", "team_lead", "agent"],
          default: "member",
        },
        created_at: { type: "string", format: "date-time" },
      },
    };
  }

  static get relationMappings() {
    const Team = require("./Team");
    const BusinessUser = require("./BusinessUser");

    return {
      team: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Team,
        join: {
          from: "team_member.team_id",
          to: "team.id",
        },
      },
      user: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: BusinessUser,
        join: {
          from: "team_member.user_id",
          to: "business_user.id",
        },
      },
    };
  }

  // Helper methods for team membership operations
  static async getMembersByTeamId(teamId, page = 1, limit = 10) {
    const result = await this.query()
      .where("team_id", teamId)
      .joinRelated("user")
      .select(
        "team_member.user_id",
        "team_member.role",
        "team_member.created_at",
        "user.first_name",
        "user.last_name",
        "user.email"
      )
      .page(page - 1, limit);

    return {
      members: result.results,
      pagination: {
        total: result.total,
        page,
        limit,
        total_pages: Math.ceil(result.total / limit),
      },
    };
  }

  static async findTeamMember(teamId, userId) {
    return this.query()
      .where({
        team_id: teamId,
        user_id: userId,
      })
      .first();
  }
}

module.exports = TeamMember;
