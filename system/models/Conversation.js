// system/models/Conversation.js
const BaseModel = require("./BaseModel");

class Conversation extends BaseModel {
  static get tableName() {
    return "conversation";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["business_id", "end_user_id", "business_channel_id"],
      properties: {
        id: { type: "string", format: "uuid" },
        business_id: { type: "string", format: "uuid" },
        end_user_id: { type: "string", format: "uuid" },
        business_channel_id: { type: "string", format: "uuid" },
        type: { type: "string", default: "support" },
        status: { type: "string", default: "active" },
        priority: { type: "string", default: "medium" },
        category: { type: "string" },
        assigned_user_id: { type: ["string", "null"], format: "uuid" },
        assigned_team_id: { type: ["string", "null"], format: "uuid" },
        agent_id: { type: ["string", "null"], format: "uuid" },
        broadcast_id: { type: ["string", "null"], format: "uuid" },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
        resolved_at: { type: ["string", "null"], format: "date-time" },
        closed_at: { type: ["string", "null"], format: "date-time" },
        first_response_at: {
          type: ["string", "null"],
          format: "date-time",
        },
        last_message_at: {
          type: ["string", "null"],
          format: "date-time",
        },
        unread_count: { type: "integer", default: 0 },
        created_by: { type: ["string", "null"], format: "uuid" },
        updated_by: { type: ["string", "null"], format: "uuid" },
        external_id: { type: ["string", "null"] },
        current_step: { type: ["string", "null"], default: "step0" },
        metadata: { type: "object", default: {} },
      },
    };
  }

  static get relationMappings() {
    const Business = require("./Business");
    const EndUser = require("./EndUser");
    const BusinessChannel = require("./BusinessChannel");
    const BusinessUser = require("./BusinessUser");
    const Broadcast = require("./Broadcast");
    const Message = require("./Message");
    const Team = require("./Team");
    const Tag = require("./Tag");

    return {
      business: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Business,
        join: {
          from: "conversation.business_id",
          to: "business.id",
        },
      },
      endUser: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: EndUser,
        join: {
          from: "conversation.end_user_id",
          to: "end_user.id",
        },
      },
      businessChannel: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: BusinessChannel,
        join: {
          from: "conversation.business_channel_id",
          to: "business_channel.id",
        },
      },
      assignedUser: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: BusinessUser,
        join: {
          from: "conversation.assigned_user_id",
          to: "business_user.id",
        },
      },
      assignedTeam: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Team,
        join: {
          from: "conversation.assigned_team_id",
          to: "team.id",
        },
      },
      agent: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require("./Agent"),
        join: {
          from: "conversation.agent_id",
          to: "agents.id",
        },
      },
      broadcast: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Broadcast,
        join: {
          from: "conversation.broadcast_id",
          to: "broadcast.id",
        },
      },
      messages: {
        relation: BaseModel.HasManyRelation,
        modelClass: Message,
        join: {
          from: "conversation.id",
          to: "message.conversation_id",
        },
      },
      tags: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: Tag,
        join: {
          from: "conversation.id",
          through: {
            from: "conversation_tag.conversation_id",
            to: "conversation_tag.tag_id",
            extra: ["created_at", "created_by"],
          },
          to: "tag.id",
        },
      },
    };
  }
}

module.exports = Conversation;
