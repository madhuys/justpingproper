// system/models/BroadcastMessage.js
const BaseModel = require("./BaseModel");

class BroadcastMessage extends BaseModel {
    static get tableName() {
        return "broadcast_message";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: ["broadcast_id", "end_user_id"],
            properties: {
                id: { type: "string", format: "uuid" },
                broadcast_id: { type: "string", format: "uuid" },
                end_user_id: { type: "string", format: "uuid" },
                status: {
                    type: "string",
                    enum: [
                        "pending",
                        "sent",
                        "delivered",
                        "read",
                        "replied",
                        "failed",
                    ],
                    default: "pending",
                },
                sent_at: { type: ["string", "null"], format: "date-time" },
                delivered_at: { type: ["string", "null"], format: "date-time" },
                read_at: { type: ["string", "null"], format: "date-time" },
                replied_at: { type: ["string", "null"], format: "date-time" },
                error_message: { type: ["string", "null"] },
                message_content: { type: "object" },
                metadata: { type: "object" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
            },
        };
    }

    static get relationMappings() {
        const Broadcast = require("./Broadcast");
        const EndUser = require("./EndUser");

        return {
            broadcast: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Broadcast,
                join: {
                    from: "broadcast_message.broadcast_id",
                    to: "broadcast.id",
                },
            },
            endUser: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: EndUser,
                join: {
                    from: "broadcast_message.end_user_id",
                    to: "end_user.id",
                },
            },
        };
    }

    // Add modifiers for common filters
    static get modifiers() {
        return {
            pending(builder) {
                builder.where("status", "pending");
            },
            sent(builder) {
                builder.where("status", "sent");
            },
            delivered(builder) {
                builder.where("status", "delivered");
            },
            read(builder) {
                builder.where("status", "read");
            },
            replied(builder) {
                builder.where("status", "replied");
            },
            failed(builder) {
                builder.where("status", "failed");
            },
        };
    }
}

module.exports = BroadcastMessage;
