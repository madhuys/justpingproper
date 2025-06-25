// system/models/TemplateButton.js
const BaseModel = require("./BaseModel");

class TemplateButton extends BaseModel {
    static get tableName() {
        return "template_button";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: [
                "template_component_id",
                "button_type",
                "text",
                "sequence",
            ],
            properties: {
                id: { type: "string", format: "uuid" },
                template_component_id: { type: "string", format: "uuid" },
                button_type: {
                    type: "string",
                    enum: ["quick_reply", "url", "phone", "copy"],
                },
                text: { type: "string", maxLength: 60 },
                payload: { type: "string", maxLength: 255 },
                sequence: { type: "integer" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
            },
        };
    }

    static get relationMappings() {
        const TemplateComponent = require("./TemplateComponent");

        return {
            component: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: TemplateComponent,
                join: {
                    from: "template_button.template_component_id",
                    to: "template_component.id",
                },
            },
        };
    }
}

module.exports = TemplateButton;
