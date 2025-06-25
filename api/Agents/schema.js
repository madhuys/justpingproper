// api/Agents/schema.js
const { Joi } = require("celebrate");

const createAgentSchema = {
    body: Joi.object({
        name: Joi.string().required().max(255).description("Agent name"),
        description: Joi.string()
            .allow("", null)
            .description("Agent description"),
        variables: Joi.array()
            .items(
                Joi.object({
                    name: Joi.string().required().description("Variable name"),
                    description: Joi.string().description(
                        "Variable description",
                    ),
                    type: Joi.string()
                        .required()
                        .description("Variable data type"),
                }),
            )
            .description("List of variables used by the agent"),
        key_words: Joi.array()
            .items(Joi.string())
            .description("List of keywords that can trigger this agent"),
        ai_character: Joi.string()
            .allow("", null)
            .description("Long-form system prompt for the agent"),
        global_rules: Joi.string()
            .allow("", null)
            .description(
                "Rule configuration for message types, language handling, etc.",
            ),
        agent_definition: Joi.object({
            nodes: Joi.array()
                .items(Joi.object())
                .description("Agent nodes configuration"),
            connections: Joi.array()
                .items(Joi.object())
                .description("Connections between nodes"),
        }).description("Agent flow definition"),
        metadata: Joi.object().description("Additional metadata"),
    }),
};

// Agent update schema
const updateAgentSchema = {
    body: Joi.object({
        name: Joi.string().max(255).description("Agent name"),
        description: Joi.string()
            .allow("", null)
            .description("Agent description"),
        variables: Joi.array()
            .items(
                Joi.object({
                    name: Joi.string().required().description("Variable name"),
                    description: Joi.string().description(
                        "Variable description",
                    ),
                    type: Joi.string()
                        .required()
                        .description("Variable data type"),
                }),
            )
            .description("List of variables used by the agent"),
        key_words: Joi.array()
            .items(Joi.string())
            .description("List of keywords that can trigger this agent"),
        ai_character: Joi.string()
            .allow("", null)
            .description("Long-form system prompt for the agent"),
        global_rules: Joi.string()
            .allow("", null)
            .description(
                "Rule configuration for message types, language handling, etc.",
            ),
        agent_definition: Joi.object({
            nodes: Joi.array()
                .items(Joi.object())
                .description("Agent nodes configuration"),
            connections: Joi.array()
                .items(Joi.object())
                .description("Connections between nodes"),
        }).description("Agent flow definition"),
        metadata: Joi.object().description("Additional metadata"),
        create_version: Joi.boolean()
            .default(false)
            .description("Whether to create a new version"),
    }).min(1),
    params: Joi.object({
        agent_id: Joi.string().uuid().required().description("Agent ID"),
    }),
};

// Agent ID parameter schema
const agentIdSchema = {
    params: Joi.object({
        agent_id: Joi.string().uuid().required().description("Agent ID"),
    }),
};

// Get agents query schema
const getAgentsSchema = {
    query: Joi.object({
        status: Joi.string()
            .valid("draft", "pending_approval", "approved", "rejected")
            .description("Filter by status"),
        is_active: Joi.boolean().description("Filter by active status"),
        search: Joi.string().description("Search in name and description"),
        key_word: Joi.string().description("Filter by specific keyword"),
        page: Joi.number()
            .integer()
            .min(1)
            .default(1)
            .description("Page number"),
        per_page: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(20)
            .description("Items per page"),
        sort_by: Joi.string()
            .valid("name", "created_at", "updated_at", "status")
            .default("created_at")
            .description("Sort by field"),
        sort_order: Joi.string()
            .valid("asc", "desc")
            .default("desc")
            .description("Sort order"),
    }),
};

// Submit for approval schema
const submitAgentSchema = {
    params: Joi.object({
        agent_id: Joi.string().uuid().required().description("Agent ID"),
    }),
};

// Approve agent schema
const approveAgentSchema = {
    params: Joi.object({
        agent_id: Joi.string().uuid().required().description("Agent ID"),
    }),
};

// Reject agent schema
const rejectAgentSchema = {
    params: Joi.object({
        agent_id: Joi.string().uuid().required().description("Agent ID"),
    }),
    body: Joi.object({
        reason: Joi.string().required().description("Rejection reason"),
    }),
};

// Toggle agent status schema
const toggleAgentStatusSchema = {
    params: Joi.object({
        agent_id: Joi.string().uuid().required().description("Agent ID"),
    }),
    body: Joi.object({
        is_active: Joi.boolean().required().description("Active status"),
    }),
};

// Clone agent schema
const cloneAgentSchema = {
    params: Joi.object({
        agent_id: Joi.string().uuid().required().description("Agent ID"),
    }),
    body: Joi.object({
        name: Joi.string().required().max(255).description("New agent name"),
        description: Joi.string()
            .allow("", null)
            .description("New agent description"),
        include_ai_config: Joi.boolean()
            .default(true)
            .description("Whether to include AI configuration"),
    }),
};

// Schema options
const options = {
    abortEarly: false,
    stripUnknown: true,
};

module.exports = {
    createAgentSchema,
    updateAgentSchema,
    agentIdSchema,
    getAgentsSchema,
    submitAgentSchema,
    approveAgentSchema,
    rejectAgentSchema,
    toggleAgentStatusSchema,
    cloneAgentSchema,
    options,
};
