// system/models/ContactGroup.js
const BaseModel = require("./BaseModel");

class ContactGroup extends BaseModel {
    static get tableName() {
        return "contact_group";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: ["business_id", "name"],
            properties: {
                id: { type: "string", format: "uuid" },
                business_id: { type: "string", format: "uuid" },
                name: { type: "string", minLength: 1, maxLength: 255 },
                description: { type: ["string", "null"] },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
                created_by: { type: ["string", "null"], format: "uuid" },
            },
        };
    }

    static get relationMappings() {
        const Business = require("./Business");
        const BusinessUser = require("./BusinessUser");
        const EndUser = require("./EndUser");
        const ContactGroupField = require("./ContactGroupField");

        return {
            business: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Business,
                join: {
                    from: "contact_group.business_id",
                    to: "business.id",
                },
            },
            creator: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: BusinessUser,
                join: {
                    from: "contact_group.created_by",
                    to: "business_user.id",
                },
            },
            contacts: {
                relation: BaseModel.ManyToManyRelation,
                modelClass: EndUser,
                join: {
                    from: "contact_group.id",
                    through: {
                        from: "contact_group_association.contact_group_id",
                        to: "contact_group_association.end_user_id",
                        extra: ["field_values", "created_at", "created_by"],
                    },
                    to: "end_user.id",
                },
            },
            fields: {
                relation: BaseModel.HasManyRelation,
                modelClass: ContactGroupField,
                join: {
                    from: "contact_group.id",
                    to: "contact_group_field.contact_group_id",
                },
            },
        };
    }

    static async findByBusinessId(businessId, filters = {}) {
        let query = this.query().where("business_id", businessId);

        // Apply filters
        if (filters.name) {
            query = query.whereRaw("LOWER(name) LIKE ?", [
                `%${filters.name.toLowerCase()}%`,
            ]);
        }

        if (filters.created_by) {
            query = query.where("created_by", filters.created_by);
        }

        // Pagination
        const page = parseInt(filters.page, 10) || 1;
        const perPage = parseInt(filters.per_page, 10) || 10;
        const offset = (page - 1) * perPage;

        // Count total groups for pagination meta
        const total = await query.clone().resultSize();

        // Apply pagination and sorting
        const sortBy = filters.sort_by || "created_at";
        const sortOrder =
            filters.sort_order?.toLowerCase() === "asc" ? "asc" : "desc";

        query = query.orderBy(sortBy, sortOrder).limit(perPage).offset(offset);

        // Execute query
        const groups = await query;

        // Get contact counts for each group
        for (const group of groups) {
            const count = await this.relatedQuery("contacts")
                .for(group.id)
                .resultSize();

            group.contact_count = count;
        }

        return {
            groups,
            meta: {
                total,
                page,
                per_page: perPage,
                total_pages: Math.ceil(total / perPage),
            },
        };
    }
}

module.exports = ContactGroup;
