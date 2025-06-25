// system/models/Broadcast.js
const BaseModel = require("./BaseModel");

class Broadcast extends BaseModel {
  static get tableName() {
    return "broadcast";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: [
        "campaign_id",
        "name",
        "business_channel_id",
        "template_id",
        "contact_group_id",
        "type",
      ],
      properties: {
        id: { type: "string", format: "uuid" },
        campaign_id: { type: "string", format: "uuid" },
        name: { type: "string", minLength: 1, maxLength: 255 },
        description: { type: ["string", "null"] },
        status: {
          type: "string",
          enum: [
            "draft",
            "scheduled",
            "active",
            "paused",
            "completed",
            "cancelled",
            "failed",
          ],
          default: "draft",
        },
        business_channel_id: { type: "string", format: "uuid" },
        template_id: { type: "string", format: "uuid" },
        contact_group_id: { type: "string", format: "uuid" },
        type: {
          type: "string",
          enum: ["inbound", "outbound"],
          description:
            "Broadcast type - inbound for incoming campaigns, outbound for marketing campaigns",
        },
        schedule_type: {
          type: "string",
          enum: ["immediate", "scheduled", "recurring"],
          default: "scheduled",
        },
        scheduled_start: {
          type: ["string", "null"],
          format: "date-time",
        },
        scheduled_end: {
          type: ["string", "null"],
          format: "date-time",
        },
        actual_start: { type: ["string", "null"], format: "date-time" },
        actual_end: { type: ["string", "null"], format: "date-time" },
        variable_mapping: {
          type: "object",
          properties: {
            contact_group: { type: "object" },
            template: { type: "object" },
            agent: { type: "object" },
          },
        },
        default_message: {
          type: "object",
          properties: {
            type: { type: "string" },
            content: { type: "string" },
          },
        },
        agent_mapping: { type: "object" },
        audience: {
          type: ["object", "null"],
          properties: {
            contact_group_ids: {
              type: "array",
              items: { type: "string", format: "uuid" },
            },
            filters: { type: "object" },
            total_contacts: { type: "integer" },
          },
        },
        analytics: {
          type: ["object", "null"],
          properties: {
            total_recipients: { type: "integer" },
            total_messages_sent: { type: "integer" },
            total_messages_delivered: { type: "integer" },
            total_messages_read: { type: "integer" },
            total_messages_replied: { type: "integer" },
            total_messages_ignored: { type: "integer" },
            total_messages_failed: { type: "integer" },
          },
        },
        original_broadcast_id: {
          type: ["string", "null"],
          format: "uuid",
        },
        metadata: { type: "object" },
        created_by: { type: "string", format: "uuid" },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
      },
    };
  }
  static get relationMappings() {
    const Campaign = require("./Campaign");
    const BusinessUser = require("./BusinessUser");
    const Template = require("./Template");
    const BusinessChannel = require("./BusinessChannel");
    const ContactGroup = require("./ContactGroup");
    const Conversation = require("./Conversation");

    return {
      campaign: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Campaign,
        join: {
          from: "broadcast.campaign_id",
          to: "campaign.id",
        },
      },
      creator: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: BusinessUser,
        join: {
          from: "broadcast.created_by",
          to: "business_user.id",
        },
      },
      template: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Template,
        join: {
          from: "broadcast.template_id",
          to: "template.id",
        },
      },
      businessChannel: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: BusinessChannel,
        join: {
          from: "broadcast.business_channel_id",
          to: "business_channel.id",
        },
      },
      contactGroup: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: ContactGroup,
        join: {
          from: "broadcast.contact_group_id",
          to: "contact_group.id",
        },
      },
      conversations: {
        relation: BaseModel.HasManyRelation,
        modelClass: Conversation,
        join: {
          from: "broadcast.id",
          to: "conversation.broadcast_id",
        },
      },
      originalBroadcast: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Broadcast,
        join: {
          from: "broadcast.original_broadcast_id",
          to: "broadcast.id",
        },
      },
      clones: {
        relation: BaseModel.HasManyRelation,
        modelClass: Broadcast,
        join: {
          from: "broadcast.id",
          to: "broadcast.original_broadcast_id",
        },
      },
    };
  }

  // Add modifiers for common filters
  static get modifiers() {
    return {
      draft(builder) {
        builder.where("status", "draft");
      },
      scheduled(builder) {
        builder.where("status", "scheduled");
      },
      active(builder) {
        builder.where("status", "active");
      },
      completed(builder) {
        builder.where("status", "completed");
      },
      notDeleted(builder) {
        builder.where("is_deleted", false);
      },
    };
  }
}

module.exports = Broadcast;
