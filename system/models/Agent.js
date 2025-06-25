// system/models/Agent.js
const BaseModel = require("./BaseModel");

class Agent extends BaseModel {
    static get tableName() {
        return "agents";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: ["business_id", "name", "created_by"],
            properties: {
                id: { type: "string", format: "uuid" },
                business_id: { type: "string", format: "uuid" },
                name: { type: "string", minLength: 1, maxLength: 255 },
                description: { type: ["string", "null"] },
                key_words: {
                    type: "array",
                    items: { type: "string" },
                },
                variables: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            description: { type: ["string", "null"] },
                            type: { type: "string" },
                        },
                    },
                },
                status: {
                    type: "string",
                    enum: ["draft", "pending_approval", "approved", "rejected"],
                    default: "draft",
                },
                created_by: { type: "string", format: "uuid" },
                is_active: { type: "boolean", default: false },
                is_deleted: { type: "boolean", default: false },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
                approved_by: { type: ["string", "null"], format: "uuid" },
                approved_at: { type: ["string", "null"], format: "date-time" },
                ai_character: { type: ["string", "null"] },
                global_rules: { type: ["string", "null"] },
                agent_definition: { type: "object" },
                metadata: { type: "object" },
                version: { type: "integer", default: 1 },
            },
        };
    }

    static get relationMappings() {
        const Business = require("./Business");
        const BusinessUser = require("./BusinessUser");

        return {
            business: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Business,
                join: {
                    from: "agents.business_id",
                    to: "business.id",
                },
            },
            creator: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: BusinessUser,
                join: {
                    from: "agents.created_by",
                    to: "business_user.id",
                },
            },
            approver: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: BusinessUser,
                join: {
                    from: "agents.approved_by",
                    to: "business_user.id",
                },
            },
        };
    }

    // Add a modifier to exclude soft-deleted records by default
    static get modifiers() {
        return {
            notDeleted(builder) {
                builder.where("is_deleted", false);
            },
        };
    }

    // Get all agents for a business with pagination
    static async findByBusinessId(businessId, filters = {}, pagination = {}) {
        try {
            // Start with base query
            let query = this.query()
                .where("business_id", businessId)
                .modify("notDeleted");

            // Apply filters
            if (filters.status) {
                query = query.where("status", filters.status);
            }

            if (filters.is_active !== undefined) {
                query = query.where("is_active", filters.is_active);
            }

            if (filters.search) {
                query = query.where((builder) => {
                    builder
                        .whereRaw("LOWER(name) LIKE ?", [
                            `%${filters.search.toLowerCase()}%`,
                        ])
                        .orWhereRaw("LOWER(description) LIKE ?", [
                            `%${filters.search.toLowerCase()}%`,
                        ]);
                });
            }

            // Apply key_words filter if provided
            if (filters.key_word) {
                query = query.whereRaw("? = ANY(key_words)", [
                    filters.key_word,
                ]);
            }

            // Get count before applying pagination
            const total = await query.clone().count("id as count").first();

            // Apply pagination
            const page = parseInt(pagination.page, 10) || 1;
            const perPage = parseInt(pagination.per_page, 10) || 20;
            const sortBy = pagination.sort_by || "created_at";
            const sortOrder = pagination.sort_order || "desc";

            query = query
                .orderBy(sortBy, sortOrder)
                .limit(perPage)
                .offset((page - 1) * perPage);

            // Execute query
            const agents = await query;

            return {
                agents,
                pagination: {
                    total: parseInt(total.count),
                    per_page: perPage,
                    current_page: page,
                    last_page: Math.ceil(total.count / perPage),
                },
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Agent;
