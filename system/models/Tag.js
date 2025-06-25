// system/models/Tag.js
const BaseModel = require("./BaseModel");

class Tag extends BaseModel {
  static get tableName() {
    return "tag";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["business_id", "name"],
      properties: {
        id: { type: "string", format: "uuid" },
        business_id: { type: "string", format: "uuid" },
        name: { type: "string", minLength: 1, maxLength: 100 },
        color: { type: "string", maxLength: 20, default: "#808080" },
        description: { type: ["string", "null"] },
        created_by: { type: ["string", "null"], format: "uuid" },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
      },
    };
  }

  static get relationMappings() {
    const Business = require("./Business");
    const BusinessUser = require("./BusinessUser");
    const Conversation = require("./Conversation");

    return {
      business: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Business,
        join: {
          from: "tag.business_id",
          to: "business.id",
        },
      },
      creator: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: BusinessUser,
        join: {
          from: "tag.created_by",
          to: "business_user.id",
        },
      },
      conversations: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: Conversation,
        join: {
          from: "tag.id",
          through: {
            from: "conversation_tag.tag_id",
            to: "conversation_tag.conversation_id",
          },
          to: "conversation.id",
        },
      },
    };
  }
}

module.exports = Tag;
