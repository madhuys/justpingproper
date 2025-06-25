const BaseModel = require("./BaseModel");

class BusinessUserInvitation extends BaseModel {
  static get tableName() {
    return "business_user_invitation";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["business_id", "email", "invited_by", "token", "expires_at"],
      properties: {
        id: { type: "string", format: "uuid" },
        business_id: { type: "string", format: "uuid" },
        email: { type: "string", format: "email", maxLength: 255 },
        invited_by: { type: "string", format: "uuid" },
        token: { type: "string", maxLength: 255 },
        role_id: { type: ["string", "null"], format: "uuid" },
        status: {
          type: "string",
          enum: ["pending", "accepted", "revoked", "expired"],
          default: "pending",
        },
        expires_at: { type: "string", format: "date-time" },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
      },
    };
  }

  static get relationMappings() {
    const Business = require("./Business");
    const BusinessUser = require("./BusinessUser");
    const Role = require("./Role");

    return {
      business: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Business,
        join: {
          from: "business_user_invitation.business_id",
          to: "business.id",
        },
      },
      inviter: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: BusinessUser,
        join: {
          from: "business_user_invitation.invited_by",
          to: "business_user.id",
        },
      },
      role: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Role,
        join: {
          from: "business_user_invitation.role_id",
          to: "role.id",
        },
      },
    };
  }

  // Helper methods
  static async findPendingInvitation(email, businessId) {
    return this.query()
      .where({
        email: email,
        business_id: businessId,
        status: "pending",
      })
      .first();
  }

  static async findByToken(token) {
    return this.query().where("token", token).first();
  }
}

module.exports = BusinessUserInvitation;
