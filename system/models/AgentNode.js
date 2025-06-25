// system/models/AgentNode.js
const BaseModel = require("./BaseModel");

class AgentNode extends BaseModel {
    static get tableName() {
        return "agent_nodes";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: ["agent_id", "step", "step_name"],
            properties: {
                id: { type: "string", format: "uuid" },
                agent_id: { type: "string", format: "uuid" },
                step: { type: "string" },
                step_name: { type: "string" },
                variable: { type: ["string", "null"] },
                mandatory: { type: "boolean", default: false },
                check_post: { type: ["string", "null"] },
                purpose: { type: ["string", "null"] },
                enable_ai_takeover: { type: "boolean", default: false },
                ai_config_id: { type: ["string", "null"], format: "uuid" },
                regex: { type: ["string", "null"] },
                next_possible_steps: {
                    type: "array",
                    items: { type: "string" },
                },
                type_of_message: { type: "string" },
                message_content: { type: "object" },
                media_items: {
                    type: "array",
                    items: { type: "object" },
                },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
            },
        };
    }

    static get relationMappings() {
        const Agent = require("./Agent");
        const AIConfig = require("./AIConfig");

        return {
            agent: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Agent,
                join: {
                    from: "agent_nodes.agent_id",
                    to: "agents.id",
                },
            },
            ai_config: {
                relation: BaseModel.HasOneRelation,
                modelClass: AIConfig,
                join: {
                    from: "agent_nodes.id",
                    to: "ai_configs.node_id",
                },
            },
        };
    }
}

module.exports = AgentNode;
