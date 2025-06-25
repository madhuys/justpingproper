// system/models/Role.js
const BaseModel = require("./BaseModel");

class Role extends BaseModel {
    static get tableName() {
        return "role";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: ["business_id", "name", "permissions"],
            properties: {
                id: { type: "string", format: "uuid" },
                business_id: { type: "string", format: "uuid" },
                name: { type: "string", minLength: 1, maxLength: 100 },
                description: { type: ["string", "null"] },
                permissions: { type: "object" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
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
                    from: "role.business_id",
                    to: "business.id",
                },
            },
            users: {
                relation: BaseModel.ManyToManyRelation,
                modelClass: BusinessUser,
                join: {
                    from: "role.id",
                    through: {
                        from: "business_user_role.role_id",
                        to: "business_user_role.user_id",
                    },
                    to: "business_user.id",
                },
            },
        };
    }

    // Helper static methods
    static async findByBusinessId(businessId, page = 1, limit = 20) {
        const result = await this.query()
            .where({ business_id: businessId })
            .page(page - 1, limit)
            .orderBy("created_at", "desc");

        return {
            data: result.results,
            total: result.total,
            page,
            limit,
        };
    }
}

module.exports = Role;
