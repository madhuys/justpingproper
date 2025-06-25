// api/TeamInbox/schema.js
const Joi = require("joi");

// Common options for celebrate middleware
const options = {
  abortEarly: false,
  allowUnknown: false,
};

// Schema for conversation query parameters
const listConversationsQuerySchema = Joi.object({
  status: Joi.string().valid("active", "pending", "closed"),
  campaign_id: Joi.string().uuid(),
  broadcast_id: Joi.string().uuid(),
  search: Joi.string().trim().allow(""),
  timeframe: Joi.string().valid("24h", "7d", "30d"),
  assigned_to: Joi.string().uuid(),
  assigned_team: Joi.string().uuid(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort_by: Joi.string()
    .valid("last_message_at", "created_at", "updated_at", "priority")
    .default("last_message_at"),
  sort_direction: Joi.string().valid("asc", "desc").default("desc"),
});

// Schema for conversation details query parameters
const conversationDetailsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

// Schema for conversation ID parameter
const conversationIdParamSchema = Joi.object({
  conversationId: Joi.string().uuid().required(),
});

// Schema for tag ID parameter
const tagIdParamSchema = Joi.object({
  conversationId: Joi.string().uuid().required(),
  tagId: Joi.string().uuid().required(),
});

// Schema for updating conversation status
const updateStatusSchema = Joi.object({
  status: Joi.string().valid("active", "pending", "closed").required(),
  note: Joi.string().max(500).allow("", null),
});

// Schema for assigning conversation
const assignConversationSchema = Joi.object({
  assigned_user_id: Joi.string().uuid().allow(null),
  assigned_team_id: Joi.string().uuid().allow(null),
  note: Joi.string().max(500).allow("", null),
}).or("assigned_user_id", "assigned_team_id");

// Schema for sending a message
const sendMessageSchema = Joi.object({
  content: Joi.string().required(),
  content_type: Joi.string()
    .valid("text", "image", "video", "document", "audio")
    .default("text"),
  is_internal: Joi.boolean().default(false),
  attachments: Joi.array()
    .items(
      Joi.object({
        file_name: Joi.string().required(),
        file_type: Joi.string().required(),
        file_size: Joi.number().required(),
        file_url: Joi.string().uri().required(),
      })
    )
    .default([]),
});

// Schema for sending an internal note
const sendNoteSchema = Joi.object({
  content: Joi.string().required(),
  mentioned_users: Joi.array().items(Joi.string().uuid()).default([]),
});

// Schema for adding a tag
const addTagSchema = Joi.object({
  tag_id: Joi.string().uuid().required(),
});

// Schema for conversation statistics
const statisticsQuerySchema = Joi.object({
  start_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  end_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  team_id: Joi.string().uuid(),
});

// Schema for creating a tag
const createTagSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .default("#808080"),
  description: Joi.string().max(255).allow("", null),
});

module.exports = {
  options,
  listConversationsQuerySchema,
  conversationDetailsQuerySchema,
  conversationIdParamSchema,
  tagIdParamSchema,
  updateStatusSchema,
  assignConversationSchema,
  sendMessageSchema,
  sendNoteSchema,
  addTagSchema,
  statisticsQuerySchema,
  createTagSchema,
};
