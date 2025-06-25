// system/models/Team.js
const BaseModel = require("./BaseModel");

class Team extends BaseModel {
  static get tableName() {
    return "team";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["business_id", "name"],
      properties: {
        id: { type: "string", format: "uuid" },
        business_id: { type: "string", format: "uuid" },
        name: { type: "string", minLength: 1, maxLength: 100 },
        description: { type: ["string", "null"] },
        status: {
          type: "string",
          enum: ["active", "inactive"],
          default: "active",
        },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
        settings: { type: "object" },
      },
    };
  }

  static get relationMappings() {
    const Business = require("./Business");
    const BusinessUser = require("./BusinessUser");
    const TeamMember = require("./TeamMember");

    return {
      business: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Business,
        join: {
          from: "team.business_id",
          to: "business.id",
        },
      },
      members: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: BusinessUser,
        join: {
          from: "team.id",
          through: {
            from: "team_member.team_id",
            to: "team_member.user_id",
            extra: ["role", "created_at"],
          },
          to: "business_user.id",
        },
      },
    };
  }

  // Helper methods for common operations
  static async findByBusinessId(businessId, filters = {}) {
    let query = this.query().where("business_id", businessId);

    // Apply filters
    if (filters.status) {
      query = query.where("status", filters.status);
    }

    if (filters.search) {
      query = query.where((builder) => {
        builder
          .whereRaw("LOWER(name) LIKE ?", [`%${filters.search.toLowerCase()}%`])
          .orWhereRaw("LOWER(description) LIKE ?", [
            `%${filters.search.toLowerCase()}%`,
          ]);
      });
    }

    // Pagination
    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Count total teams for pagination meta
    const total = await query.clone().resultSize();

    // Apply pagination and sorting
    const sortBy = filters.sort_by || "created_at";
    const sortOrder =
      filters.sort_order?.toLowerCase() === "asc" ? "asc" : "desc";

    query = query.orderBy(sortBy, sortOrder).limit(limit).offset(offset);

    // Execute query
    const teams = await query;

    return {
      teams,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  static async findByIdAndBusinessId(id, businessId) {
    return this.query()
      .where({
        id,
        business_id: businessId,
      })
      .first();
  }
}

module.exports = Team;
