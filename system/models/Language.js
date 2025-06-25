// system/models/Language.js
const BaseModel = require("./BaseModel");

class Language extends BaseModel {
    static get tableName() {
        return "language";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: ["code", "name"],
            properties: {
                id: { type: "string", format: "uuid" },
                code: { type: "string", minLength: 2, maxLength: 10 },
                name: { type: "string", minLength: 1, maxLength: 100 },
                native_name: { type: ["string", "null"], maxLength: 100 },
                is_active: { type: "boolean" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
            },
        };
    }

    static get relationMappings() {
        const Template = require("./Template");

        return {
            templates: {
                relation: BaseModel.HasManyRelation,
                modelClass: Template,
                join: {
                    from: "language.id",
                    to: "template.language_id",
                },
            },
        };
    }
}

module.exports = Language;
