// system/models/BusinessChannel.js
const BaseModel = require("./BaseModel");

class BusinessChannel extends BaseModel {
    static get tableName() {
        return "business_channel";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: [
                "business_id",
                "channel_id",
                "name",
                "provider_id",
                "config",
            ],
            properties: {
                id: { type: "string", format: "uuid" },
                business_id: { type: "string", format: "uuid" },
                channel_id: { type: "string", format: "uuid" },
                name: { type: "string", minLength: 1, maxLength: 100 },
                description: { type: ["string", "null"] },
                provider_id: { type: "string" },
                provider_name: { type: "string" }, // Store the provider name for reference
                status: {
                    type: "string",
                    enum: ["active", "inactive", "pending"],
                    default: "active",
                },
                config: { type: "object" },
                created_by: { type: ["string", "null"], format: "uuid" },
                is_deleted: { type: "boolean", default: false },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
            },
        };
    }

    static get relationMappings() {
        const Business = require("./Business");
        const Channel = require("./Channel");
        const BusinessUser = require("./BusinessUser");

        return {
            business: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Business,
                join: {
                    from: "business_channel.business_id",
                    to: "business.id",
                },
            },
            channel: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Channel,
                join: {
                    from: "business_channel.channel_id",
                    to: "channel.id",
                },
            },
            businessChannel: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Channel,
                join: {
                    from: "business_channel.channel_id",
                    to: "channel.id",
                },
            },
            creator: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: BusinessUser,
                join: {
                    from: "business_channel.created_by",
                    to: "business_user.id",
                },
            },
        };
    }

    // Add a modifier to exclude soft-deleted records by default
    static modifiers = {
        notDeleted(query) {
            query.where("business_channel.is_deleted", false);
        },
    };
}

module.exports = BusinessChannel;
