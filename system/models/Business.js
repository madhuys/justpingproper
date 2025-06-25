const BaseModel = require("./BaseModel");

class Business extends BaseModel {
    static get tableName() {
        return "business";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: ["name"],
            properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string", minLength: 1, maxLength: 255 },
                description: { type: "string" },
                website: { type: "string" },
                industry: { type: "string" },
                subscription_plan: { type: "string" },
                status: { type: "string" },
                contact_info: { type: "object" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
            },
        };
    }

    static get relationMappings() {
        const Business = require("./Business");
        const Channel = require("./Channel");

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
        };
    }
}

module.exports = Business;
