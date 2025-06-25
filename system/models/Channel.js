// system/models/Channel.js
const BaseModel = require("./BaseModel");

class Channel extends BaseModel {
    static get tableName() {
        return "channel";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: ["name"],
            properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string", minLength: 1, maxLength: 50 },
                description: { type: ["string", "null"] },
                providers_config_schema: {
                    type: "array",
                    items: {
                        type: "object",
                        required: ["name"],
                        properties: {
                            id: { type: "string", format: "uuid" },
                            name: { type: "string" },
                            required: {
                                type: "array",
                                items: { type: "string" },
                            },
                            properties: { type: "object" },
                        },
                    },
                },
                created_by: { type: ["string", "null"], format: "uuid" },
                business_id: { type: ["string", "null"], format: "uuid" },
                is_deleted: { type: "boolean", default: false },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
            },
        };
    }

    static get relationMappings() {
        const BusinessChannel = require("./BusinessChannel");
        const BusinessUser = require("./BusinessUser");
        const Business = require("./Business");

        return {
            businessChannels: {
                relation: BaseModel.HasManyRelation,
                modelClass: BusinessChannel,
                join: {
                    from: "channel.id",
                    to: "business_channel.channel_id",
                },
            },
            creator: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: BusinessUser,
                join: {
                    from: "channel.created_by",
                    to: "business_user.id",
                },
            },
            business: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Business,
                join: {
                    from: "channel.business_id",
                    to: "business.id",
                },
            },
        };
    }

    // Add a modifier to exclude soft-deleted records by default
    static get modifiers() {
        return {
            notDeleted(builder) {
                builder.where("is_deleted", false);
            },
        };
    }
}

module.exports = Channel;
