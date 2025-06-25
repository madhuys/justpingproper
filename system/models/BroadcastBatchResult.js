const { Model } = require("objection");

class BroadcastBatchResult extends Model {
    static get tableName() {
        return "broadcast_batch_results";
    }

    static get idColumn() {
        return "id";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: ["broadcast_id", "provider", "contact_count"],
            properties: {
                id: { type: "string", format: "uuid" },
                broadcast_id: { type: "string", format: "uuid" },
                status: { type: "string" },
                provider: { type: "string" },
                // Fix the union type issue by using anyOf instead
                batch_response: {
                    anyOf: [
                        { type: "object" },
                        { type: "array" },
                        { type: "null" },
                    ],
                },
                batch_id: { type: ["string", "null"] },
                batch_status: { type: ["string", "null"] },
                batch_message: { type: ["string", "null"] },
                // Fix the union type issue by using anyOf instead
                metrics: {
                    anyOf: [{ type: "object" }, { type: "null" }],
                },
                contact_count: { type: "integer" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
            },
        };
    }

    static get relationMappings() {
        const Broadcast = require("./Broadcast");

        return {
            broadcast: {
                relation: Model.BelongsToOneRelation,
                modelClass: Broadcast,
                join: {
                    from: "broadcast_batch_results.broadcast_id",
                    to: "broadcasts.id",
                },
            },
        };
    }

    $beforeInsert() {
        this.created_at = new Date().toISOString();
        this.updated_at = new Date().toISOString();
    }

    $beforeUpdate() {
        this.updated_at = new Date().toISOString();
    }
}

module.exports = BroadcastBatchResult;
