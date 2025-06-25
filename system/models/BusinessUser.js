const BaseModel = require("./BaseModel");

class BusinessUser extends BaseModel {
  static get tableName() {
    return "business_user";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["business_id", "email", "firebase_uid"],
      properties: {
        id: { type: "string", format: "uuid" },
        business_id: { type: "string", format: "uuid" },
        email: { type: "string", format: "email" },
        firebase_uid: { type: "string" }, // Added for Firebase Authentication
        first_name: { type: "string" },
        last_name: { type: "string" },
        status: { type: "string" },
        is_password_created: { type: "boolean" },
        email_verified: { type: "boolean" },
        email_verified_at: { type: "string", format: "date-time" },
        failed_login_attempts: { type: "integer" },
        locked_out_until: { type: "string", format: "date-time" },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
        metadata: { type: "object" },
      },
    };
  }

  static get relationMappings() {
    const Business = require("./Business");
    const Role = require("./Role");

    return {
      business: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Business,
        join: {
          from: "business_user.business_id",
          to: "business.id",
        },
      },
      roles: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: Role,
        join: {
          from: "business_user.id",
          through: {
            from: "business_user_role.user_id",
            to: "business_user_role.role_id",
          },
          to: "role.id",
        },
      },
    };
  }
}

module.exports = BusinessUser;
