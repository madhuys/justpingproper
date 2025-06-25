// system/models/MessageAttachment.js
const BaseModel = require("./BaseModel");

class MessageAttachment extends BaseModel {
    static get tableName() {
        return "message_attachment";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: [
                "message_id",
                "file_name",
                "file_type",
                "file_size",
                "file_url",
            ],
            properties: {
                id: { type: "string", format: "uuid" },
                message_id: { type: "string", format: "uuid" },
                file_name: { type: "string" },
                file_type: { type: "string" },
                file_size: { type: "integer" },
                file_url: { type: "string" },
                created_at: { type: "string", format: "date-time" },
            },
        };
    }

    static get relationMappings() {
        const Message = require("./Message");

        return {
            message: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Message,
                join: {
                    from: "message_attachment.message_id",
                    to: "message.id",
                },
            },
        };
    }
}

module.exports = MessageAttachment;
