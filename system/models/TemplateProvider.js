// system/models/TemplateProvider.js
const BaseModel = require("./BaseModel");

class TemplateProvider extends BaseModel {
    static get tableName() {
        return "template_provider";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: [
                "template_id",
                "channel_id",
                "provider_name",
                "provider_template_name",
            ],
            properties: {
                id: { type: "string", format: "uuid" },
                template_id: { type: "string", format: "uuid" },
                channel_id: { type: "string", format: "uuid" },
                provider_name: { type: "string", maxLength: 50 },
                provider_template_name: { type: "string", maxLength: 128 },
                provider_template_id: { type: "string", maxLength: 255 },
                metadata: { type: "object" },
                approval_status: {
                    type: "string",
                    enum: ["pending", "approved", "rejected"],
                    default: "pending",
                },
                approved_at: { type: "string", format: "date-time" },
                rejected_reason: { type: "string" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
            },
        };
    }

    static get relationMappings() {
        const Template = require("./Template");
        const Channel = require("./Channel");

        return {
            template: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Template,
                join: {
                    from: "template_provider.template_id",
                    to: "template.id",
                },
            },
            channel: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Channel,
                join: {
                    from: "template_provider.channel_id",
                    to: "channel.id",
                },
            },
        };
    }
}

module.exports = TemplateProvider;
