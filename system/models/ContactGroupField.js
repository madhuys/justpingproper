// system/models/ContactGroupField.js
const BaseModel = require("./BaseModel");

class ContactGroupField extends BaseModel {
    static get tableName() {
        return "contact_group_field";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: ["contact_group_id", "name", "field_type"],
            properties: {
                id: { type: "string", format: "uuid" },
                contact_group_id: { type: "string", format: "uuid" },
                name: { type: "string", minLength: 1, maxLength: 100 },
                field_type: {
                    type: "string",
                    enum: [
                        "text",
                        "number",
                        "date",
                        "boolean",
                        "select",
                        "email",
                        "phone",
                    ],
                },
                is_required: { type: "boolean" },
                default_value: { type: ["string", "null"] },
                validation_rules: { type: "object" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
                created_by: { type: ["string", "null"], format: "uuid" },
            },
        };
    }

    static get relationMappings() {
        const ContactGroup = require("./ContactGroup");
        const BusinessUser = require("./BusinessUser");

        return {
            contactGroup: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: ContactGroup,
                join: {
                    from: "contact_group_field.contact_group_id",
                    to: "contact_group.id",
                },
            },
            creator: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: BusinessUser,
                join: {
                    from: "contact_group_field.created_by",
                    to: "business_user.id",
                },
            },
        };
    }
}

module.exports = ContactGroupField;
