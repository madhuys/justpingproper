// system/models/TemplateMedia.js
const BaseModel = require("./BaseModel");

class TemplateMedia extends BaseModel {
    static get tableName() {
        return "template_media";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: ["template_id", "media_type", "url"],
            properties: {
                id: { type: "string", format: "uuid" },
                template_id: { type: "string", format: "uuid" },
                component_id: { type: ["string", "null"], format: "uuid" },
                media_type: {
                    type: "string",
                    enum: ["image", "document", "video", "location"],
                },
                url: { type: ["string", "null"] },
                caption: { type: ["string", "null"], maxLength: 255 },
                filename: { type: ["string", "null"], maxLength: 255 },
                metadata: { type: "object" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
            },
        };
    }

    static get relationMappings() {
        const Template = require("./Template");
        const TemplateComponent = require("./TemplateComponent");

        return {
            template: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Template,
                join: {
                    from: "template_media.template_id",
                    to: "template.id",
                },
            },
            component: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: TemplateComponent,
                join: {
                    from: "template_media.component_id",
                    to: "template_component.id",
                },
            },
        };
    }
}

module.exports = TemplateMedia;
