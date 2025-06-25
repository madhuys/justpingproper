// api/ConversationFlow/schema.js
const Joi = require("joi");

/**
 * Schema for getting conversation details
 */
module.exports.getConversation = {
  params: Joi.object({
    conversationId: Joi.string().uuid().required(),
  }),
};

/**
 * Schema for resetting conversation
 */
module.exports.resetConversation = {
  params: Joi.object({
    conversationId: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    step: Joi.string()
      .pattern(/^step\d+$/)
      .default("step0"),
    clearVariables: Joi.boolean().default(false),
    reason: Joi.string().max(255).default("manual_reset"),
  }),
};

/**
 * Schema for getting agent flow
 */
module.exports.getAgentFlow = {
  params: Joi.object({
    agentId: Joi.string().uuid().required(),
  }),
};

/**
 * Schema for validating agent flow
 */
module.exports.validateFlow = {
  params: Joi.object({
    agentId: Joi.string().uuid().required(),
  }),
};

/**
 * Schema for getting analytics
 */
module.exports.getAnalytics = {
  query: Joi.object({
    startDate: Joi.string().isoDate().optional(),
    endDate: Joi.string().isoDate().optional(),
    agentId: Joi.string().uuid().optional(),
    businessChannelId: Joi.string().uuid().optional(),
    status: Joi.string()
      .valid("pending", "active", "completed", "abandoned", "escalated")
      .optional(),
    includePerformance: Joi.string().valid("true", "false").default("false"),
  }),
};

/**
 * Schema for exporting data
 */
module.exports.exportData = {
  query: Joi.object({
    startDate: Joi.string().isoDate().optional(),
    endDate: Joi.string().isoDate().optional(),
    agentId: Joi.string().uuid().optional(),
    businessChannelId: Joi.string().uuid().optional(),
    status: Joi.string()
      .valid("pending", "active", "completed", "abandoned", "escalated")
      .optional(),
    format: Joi.string().valid("json", "csv").default("json"),
    includeAnalytics: Joi.string().valid("true", "false").default("true"),
  }),
};

/**
 * Schema for health dashboard
 */
module.exports.getHealthDashboard = {
  query: Joi.object({
    period: Joi.string().valid("1d", "7d", "30d", "90d").default("7d"),
  }),
};

/**
 * Schema for getting conversations by broadcast ID
 */
module.exports.getConversationsByBroadcastId = {
  params: Joi.object({
    broadcastId: Joi.string().uuid().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string()
      .valid(
        "pending",
        "active",
        "completed",
        "abandoned",
        "escalated",
        "closed",
      )
      .optional(),
  }),
};

/**
 * Schema for getting conversations by status
 */
module.exports.getConversationsByStatus = {
  params: Joi.object({
    status: Joi.string()
      .valid(
        "pending",
        "active",
        "completed",
        "abandoned",
        "escalated",
        "closed",
      )
      .required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    broadcastId: Joi.string().uuid().optional(),
    agentId: Joi.string().uuid().optional(),
    businessChannelId: Joi.string().uuid().optional(),
    startDate: Joi.string().isoDate().optional(),
    endDate: Joi.string().isoDate().optional(),
  }),
};

/**
 * Schema for getting conversation by ID
 */
module.exports.getConversationById = {
  params: Joi.object({
    conversationId: Joi.string().uuid().required(),
  }),
  query: Joi.object({
    includeMessages: Joi.string().valid("true", "false").default("false"),
    messageLimit: Joi.number().integer().min(1).max(200).default(50),
  }),
};

/**
 * Schema for getting agent mapping from broadcast using conversation data
 */
module.exports.getAgentMappingFromBroadcast = {
  params: Joi.object({
    conversationId: Joi.string().uuid().required(),
  }),
};

/**
 * Schema for finding specific agent from broadcast data
 */
module.exports.findAgentFromBroadcast = {
  params: Joi.object({
    conversationId: Joi.string().uuid().required(),
    agentId: Joi.string().uuid().required(),
  }),
};

/**
 * Schema for finding agent with keyword fallback logic
 */
module.exports.findAgentWithKeywordFallback = {
  params: Joi.object({
    conversationId: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    userInput: Joi.string()
      .required()
      .min(1)
      .max(1000)
      .description("User's message text for keyword matching"),
  }),
};
