// system/models/MessageStatus.js
const BaseModel = require("./BaseModel");

class MessageStatus extends BaseModel {
    static get tableName() {
        return "message_status";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: ["provider_message_id", "business_channel_id", "status"],
            properties: {
                id: { type: "string", format: "uuid" },
                provider_message_id: { type: "string" },
                business_channel_id: { type: "string", format: "uuid" },
                end_user_id: { type: "string", format: "uuid" },
                status: { type: "string" },
                reason: { type: "string" },
                error_code: { type: "string" },
                timestamp: { type: "string", format: "date-time" },
                provider: { type: "string" },
                metadata: { type: "object" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
            },
        };
    }

    static get relationMappings() {
        const EndUser = require("./EndUser");
        const BusinessChannel = require("./BusinessChannel");
        const Message = require("./Message");

        return {
            endUser: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: EndUser,
                join: {
                    from: "message_status.end_user_id",
                    to: "end_user.id",
                },
            },
            businessChannel: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: BusinessChannel,
                join: {
                    from: "message_status.business_channel_id",
                    to: "business_channel.id",
                },
            },
            message: {
                relation: BaseModel.HasOneRelation,
                modelClass: Message,
                join: {
                    from: "message_status.provider_message_id",
                    to: "message.provider_message_id",
                },
            },
        };
    }
}

module.exports = MessageStatus;
