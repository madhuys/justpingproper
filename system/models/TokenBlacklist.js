const { Model } = require("objection");
const BaseModel = require("./BaseModel");

class TokenBlacklist extends BaseModel {
  static get tableName() {
    return "token_blacklist";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["token", "expires_at"],
      properties: {
        id: { type: "integer" },
        token: { type: "string" },
        expires_at: { type: "string", format: "date-time" },
        created_at: { type: "string", format: "date-time" },
      },
    };
  }
}

module.exports = TokenBlacklist;
