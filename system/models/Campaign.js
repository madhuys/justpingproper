// system/models/Campaign.js
const BaseModel = require("./BaseModel");

class Campaign extends BaseModel {
    static get tableName() {
        return "campaign";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: [
                "business_id",
                "name",
                "type",
                "channel_id",
                "created_by",
            ],
            properties: {
                id: { type: "string", format: "uuid" },
                business_id: { type: "string", format: "uuid" },
                name: { type: "string", minLength: 1, maxLength: 255 },
                description: { type: ["string", "null"] },
                type: {
                    type: "string",
                    enum: ["outbound", "inbound"],
                },
                channel_id: { type: "string", format: "uuid" },
                status: {
                    type: "string",
                    enum: ["draft", "active", "paused", "completed"],
                    default: "draft",
                },
                created_by: { type: "string", format: "uuid" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
                metadata: { type: "object" },
                aggregation: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            description: { type: "string" },
                            mandatory: { type: "boolean" },
                            validation: { type: "string" },
                        },
                    },
                },
            },
        };
    }

    static get relationMappings() {
        const Business = require("./Business");
        const BusinessUser = require("./BusinessUser");
        const Channel = require("./Channel");
        const Broadcast = require("./Broadcast"); // You'll need to create this model too

        return {
            business: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Business,
                join: {
                    from: "campaign.business_id",
                    to: "business.id",
                },
            },
            creator: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: BusinessUser,
                join: {
                    from: "campaign.created_by",
                    to: "business_user.id",
                },
            },
            channel: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Channel,
                join: {
                    from: "campaign.channel_id",
                    to: "channel.id",
                },
            },
            broadcasts: {
                relation: BaseModel.HasManyRelation,
                modelClass: Broadcast,
                join: {
                    from: "campaign.id",
                    to: "broadcast.campaign_id",
                },
            },
        };
    }

    // Add a modifier to filter active campaigns
    static get modifiers() {
        return {
            active(builder) {
                builder.where("status", "active");
            },
            notDeleted(builder) {
                builder.where("is_deleted", false);
            },
        };
    }

    // Helper method to get campaigns with pagination and filtering
    static async findByBusinessId(businessId, filters = {}, pagination = {}) {
        try {
            // Start with base query
            let query = this.query()
                .where("business_id", businessId)
                .modify("notDeleted");

            // Apply filters
            if (filters.type) {
                query = query.where("type", filters.type);
            }

            if (filters.status) {
                query = query.where("status", filters.status);
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

            // Get total count before applying pagination
            const total = await query.clone().count("id as count").first();

            // Apply pagination and sorting
            const page = parseInt(pagination.page, 10) || 1;
            const perPage = parseInt(pagination.per_page, 10) || 20;
            const sortBy = pagination.sort_by || "created_at";
            const sortOrder = pagination.sort_order || "desc";

            query = query
                .orderBy(sortBy, sortOrder)
                .limit(perPage)
                .offset((page - 1) * perPage);

            // Execute query
            const campaigns = await query.withGraphFetched(
                "[channel, creator]",
            );

            return {
                data: campaigns,
                pagination: {
                    total: parseInt(total.count),
                    count: campaigns.length,
                    per_page: perPage,
                    current_page: page,
                    total_pages: Math.ceil(total.count / perPage),
                },
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Campaign;
