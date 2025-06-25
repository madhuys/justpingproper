// system/models/AIConfig.js
const BaseModel = require("./BaseModel");

class AIConfig extends BaseModel {
    static get tableName() {
        return "ai_configs";
    }

    static get jsonSchema() {
        return {
            type: "object",
            properties: {
                id: { type: "string", format: "uuid" },
                node_id: { type: "string", format: "uuid" },
                system_prompt: { type: ["string", "null"] },
                ai_provider: { type: "string", default: "gpt" },
                model: { type: "string", default: "gpt-4o" },
                max_tokens: { type: "integer", default: 1024 },
                temperature: { type: "number", default: 0.7 },
                context_input: { type: ["string", "null"] },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
            },
        };
    }

    static get relationMappings() {
        const AgentNode = require("./AgentNode");

        return {
            node: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: AgentNode,
                join: {
                    from: "ai_configs.node_id",
                    to: "agent_nodes.id",
                },
            },
        };
    }
}

module.exports = AIConfig;
