// system/models/TemplateComponent.js
const BaseModel = require("./BaseModel");

class TemplateComponent extends BaseModel {
    static get tableName() {
        return "template_component";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: ["template_id", "component_type", "sequence"],
            properties: {
                id: { type: "string", format: "uuid" },
                template_id: { type: "string", format: "uuid" },
                component_type: {
                    type: "string",
                    enum: [
                        "header",
                        "body",
                        "footer",
                        "carousel",
                        "carousel_card",
                    ],
                },
                content: { type: "string" },
                sequence: { type: "integer" },
                parent_component_id: {
                    type: ["string", "null"],
                    format: "uuid",
                },
                metadata: { type: "object" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
            },
        };
    }

    static get relationMappings() {
        const Template = require("./Template");
        const TemplateButton = require("./TemplateButton");

        return {
            template: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Template,
                join: {
                    from: "template_component.template_id",
                    to: "template.id",
                },
            },
            buttons: {
                relation: BaseModel.HasManyRelation,
                modelClass: TemplateButton,
                join: {
                    from: "template_component.id",
                    to: "template_button.template_component_id",
                },
            },
            children: {
                relation: BaseModel.HasManyRelation,
                modelClass: TemplateComponent,
                join: {
                    from: "template_component.id",
                    to: "template_component.parent_component_id",
                },
            },
            parent: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: TemplateComponent,
                join: {
                    from: "template_component.parent_component_id",
                    to: "template_component.id",
                },
            },
        };
    }
}

module.exports = TemplateComponent;
