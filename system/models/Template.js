// system/models/Template.js
const BaseModel = require("./BaseModel");

class Template extends BaseModel {
    static get tableName() {
        return "template";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: [
                "business_id",
                "name",
                "category",
                "language_id",
                "business_channel",
                "content",
            ],
            properties: {
                id: { type: "string", format: "uuid" },
                business_id: { type: "string", format: "uuid" },
                name: { type: "string", minLength: 1, maxLength: 128 },
                description: { type: "string" },
                category: {
                    type: "string",
                    enum: ["utility", "authentication", "marketing"],
                },
                language_id: { type: "string", format: "uuid" },
                business_channel: { type: "string", format: "uuid" },
                content: { type: "string" },
                variables: { type: ["object", "null"] },
                status: {
                    type: "string",
                    enum: ["draft", "pending_approval", "approved", "rejected"],
                },
                external_template_id: { type: "string" },
                created_by: { type: "string", format: "uuid" },
                approved_by: { type: "string", format: "uuid" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
                approved_at: { type: "string", format: "date-time" },
                last_edit_at: { type: "string", format: "date-time" },
                version: { type: "integer" },
                metadata: { type: "object" },
            },
        };
    }

    static get relationMappings() {
        const Business = require("./Business");
        const Language = require("./Language");
        const BusinessChannel = require("./BusinessChannel");
        const BusinessUser = require("./BusinessUser");
        const TemplateComponent = require("./TemplateComponent");
        const TemplateProvider = require("./TemplateProvider");
        const TemplateMedia = require("./TemplateMedia");
        const Channel = require("./Channel");

        return {
            business: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Business,
                join: {
                    from: "template.business_id",
                    to: "business.id",
                },
            },
            language: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Language,
                join: {
                    from: "template.language_id",
                    to: "language.id",
                },
            },
            businessChannel: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: BusinessChannel,
                join: {
                    from: "template.business_channel",
                    to: "business_channel.id",
                },
            },
            channel: {
                relation: BaseModel.HasOneThroughRelation,
                modelClass: Channel,
                join: {
                    from: "template.business_channel",
                    through: {
                        from: "business_channel.id",
                        to: "business_channel.channel_id",
                    },
                    to: "channel.id",
                },
            },
            creator: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: BusinessUser,
                join: {
                    from: "template.created_by",
                    to: "business_user.id",
                },
            },
            approver: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: BusinessUser,
                join: {
                    from: "template.approved_by",
                    to: "business_user.id",
                },
            },
            components: {
                relation: BaseModel.HasManyRelation,
                modelClass: TemplateComponent,
                join: {
                    from: "template.id",
                    to: "template_component.template_id",
                },
            },
            providers: {
                relation: BaseModel.HasManyRelation,
                modelClass: TemplateProvider,
                join: {
                    from: "template.id",
                    to: "template_provider.template_id",
                },
            },
            media: {
                relation: BaseModel.HasManyRelation,
                modelClass: TemplateMedia,
                join: {
                    from: "template.id",
                    to: "template_media.template_id",
                },
            },
        };
    }
}

module.exports = Template;
