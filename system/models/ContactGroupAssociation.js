// system/models/ContactGroupAssociation.js
const BaseModel = require("./BaseModel");

class ContactGroupAssociation extends BaseModel {
    static get tableName() {
        return "contact_group_association";
    }

    static get idColumn() {
        // This model has a composite primary key
        return ["contact_group_id", "end_user_id"];
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: ["contact_group_id", "end_user_id"],
            properties: {
                contact_group_id: { type: "string", format: "uuid" },
                end_user_id: { type: "string", format: "uuid" },
                field_values: { type: "object" },
                created_at: { type: "string", format: "date-time" },
                created_by: { type: ["string", "null"], format: "uuid" },
            },
        };
    }

    static get relationMappings() {
        const ContactGroup = require("./ContactGroup");
        const EndUser = require("./EndUser");
        const BusinessUser = require("./BusinessUser");

        return {
            contactGroup: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: ContactGroup,
                join: {
                    from: "contact_group_association.contact_group_id",
                    to: "contact_group.id",
                },
            },
            endUser: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: EndUser,
                join: {
                    from: "contact_group_association.end_user_id",
                    to: "end_user.id",
                },
            },
            creator: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: BusinessUser,
                join: {
                    from: "contact_group_association.created_by",
                    to: "business_user.id",
                },
            },
        };
    }
}

module.exports = ContactGroupAssociation;
