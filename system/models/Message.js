// system/models/Message.js
const BaseModel = require("./BaseModel");

class Message extends BaseModel {
  static get tableName() {
    return "message";
  }
  static get jsonSchema() {
    return {
      type: "object",
      required: ["conversation_id", "sender_type", "sender_id"],
      properties: {
        id: { type: "string", format: "uuid" },
        conversation_id: { type: "string", format: "uuid" },
        sender_type: { type: "string" },
        sender_id: { type: "string", format: "uuid" },
        content: { type: "object" },
        content_type: { type: "string", default: "text" },
        metadata: { type: "object" },
        is_internal: { type: "boolean", default: false },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
        delivered_at: { type: ["string", "null"], format: "date-time" },
        read_at: { type: ["string", "null"], format: "date-time" },
        external_id: { type: "string" },
        provider_message_id: { type: ["string", "null"] },
        provider: { type: ["string", "null"] },
        status: { type: ["string", "null"] },
        end_user_id: { type: ["string", "null"], format: "uuid" },
        business_channel_id: { type: ["string", "null"], format: "uuid" },
        message_type: { type: ["string", "null"] },
        direction: { type: ["string", "null"] },
        message_content: { type: ["object", "null"] },
        sent_at: { type: ["string", "null"], format: "date-time" },
        template_id: { type: ["string", "null"], format: "uuid" },
        broadcast_id: { type: ["string", "null"], format: "uuid" },
      },
    };
  }
  static get relationMappings() {
    const Conversation = require("./Conversation");
    const MessageAttachment = require("./MessageAttachment");
    const EndUser = require("./EndUser");
    const BusinessChannel = require("./BusinessChannel");
    const Template = require("./Template");
    const Broadcast = require("./Broadcast");

    return {
      conversation: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Conversation,
        join: {
          from: "message.conversation_id",
          to: "conversation.id",
        },
      },
      attachments: {
        relation: BaseModel.HasManyRelation,
        modelClass: MessageAttachment,
        join: {
          from: "message.id",
          to: "message_attachment.message_id",
        },
      },
      endUser: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: EndUser,
        join: {
          from: "message.end_user_id",
          to: "end_user.id",
        },
      },
      businessChannel: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: BusinessChannel,
        join: {
          from: "message.business_channel_id",
          to: "business_channel.id",
        },
      },
      template: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Template,
        join: {
          from: "message.template_id",
          to: "template.id",
        },
      },
      broadcast: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Broadcast,
        join: {
          from: "message.broadcast_id",
          to: "broadcast.id",
        },
      },
    };
  }
}

module.exports = Message;
