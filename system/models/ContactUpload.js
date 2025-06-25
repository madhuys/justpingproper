// system/models/ContactUpload.js
const BaseModel = require("./BaseModel");

class ContactUpload extends BaseModel {
    static get tableName() {
        return "contact_upload";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: [
                "business_id",
                "uploaded_by",
                "filename",
                "original_filename",
                "file_size",
            ],
            properties: {
                id: { type: "string", format: "uuid" },
                business_id: { type: "string", format: "uuid" },
                uploaded_by: { type: "string", format: "uuid" },
                contact_group_id: { type: ["string", "null"], format: "uuid" },
                filename: { type: "string", maxLength: 255 },
                original_filename: { type: "string", maxLength: 255 },
                file_size: { type: "integer", minimum: 0 },
                status: {
                    type: "string",
                    enum: ["pending", "processing", "completed", "failed"],
                    default: "pending",
                },
                total_records: { type: ["integer", "null"] },
                processed_records: { type: "integer", default: 0 },
                accepted_records: { type: "integer", default: 0 },
                rejected_records: { type: "integer", default: 0 },
                errors: { type: "object" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
                completed_at: { type: ["string", "null"], format: "date-time" },
            },
        };
    }

    static get relationMappings() {
        const Business = require("./Business");
        const BusinessUser = require("./BusinessUser");
        const ContactGroup = require("./ContactGroup");
        const EndUser = require("./EndUser");

        return {
            business: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Business,
                join: {
                    from: "contact_upload.business_id",
                    to: "business.id",
                },
            },
            uploader: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: BusinessUser,
                join: {
                    from: "contact_upload.uploaded_by",
                    to: "business_user.id",
                },
            },
            contactGroup: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: ContactGroup,
                join: {
                    from: "contact_upload.contact_group_id",
                    to: "contact_group.id",
                },
            },
            contacts: {
                relation: BaseModel.HasManyRelation,
                modelClass: EndUser,
                join: {
                    from: "contact_upload.id",
                    to: "end_user.source_id",
                },
            },
        };
    }
}

module.exports = ContactUpload;
