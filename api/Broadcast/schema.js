// api/Broadcast/schema.js
const { Joi } = require("celebrate");

// Define validation for variable mapping
const variableMappingSchema = Joi.object({
  contact_group: Joi.object()
    .pattern(Joi.string(), Joi.string())
    .description("Mapping from template variables to contact group fields"),
  template: Joi.object()
    .pattern(Joi.string(), Joi.string())
    .description("Mapping from template variables to template variables"),
  agent: Joi.object()
    .pattern(Joi.string(), Joi.string())
    .description("Mapping from template variables to agent variables"),
});

// Define validation for default message
const defaultMessageSchema = Joi.object({
  type: Joi.string()
    .required()
    .valid("text", "image", "video", "document")
    .description("Type of default message"),
  content: Joi.string().required().description("Content of default message"),
});

// Schema for creating a new broadcast
const createBroadcastSchema = {
  params: Joi.object({
    campaign_id: Joi.string().uuid().required().description("Campaign ID"),
  }),
  body: Joi.object({
    name: Joi.string().required().max(255).description("Broadcast name"),
    description: Joi.string()
      .allow("", null)
      .description("Broadcast description"),
    business_channel_id: Joi.string()
      .uuid()
      .required()
      .description("Business channel ID"),
    template_id: Joi.string().uuid().required().description("Template ID"),
    contact_group_id: Joi.string()
      .uuid()
      .required()
      .description("Contact group ID"),
    variable_mapping: variableMappingSchema.description(
      "Variable mapping configuration",
    ),
    default_message: defaultMessageSchema.description(
      "Default message configuration",
    ),
    agent_mapping: Joi.object()
      .pattern(Joi.string(), Joi.string().uuid())
      .description("Mapping of template buttons to agent IDs"),
    type: Joi.string()
      .valid("inbound", "outbound")
      .required()
      .description(
        "Broadcast type - inbound uses keyword matching, outbound uses agent mapping",
      ),
    schedule_type: Joi.string()
      .valid("immediate", "scheduled", "recurring")
      .default("scheduled")
      .description("Type of scheduling"),
    scheduled_start: Joi.string()
      .isoDate()
      .description("Scheduled start time (ISO 8601 format)"),
    scheduled_end: Joi.string()
      .isoDate()
      .description(
        "Scheduled end time for recurring broadcasts (ISO 8601 format)",
      ),
    metadata: Joi.object().description("Additional metadata"),
  }),
};

// Schema for updating a broadcast
const updateBroadcastSchema = {
  params: Joi.object({
    broadcast_id: Joi.string().uuid().required().description("Broadcast ID"),
  }),
  body: Joi.object({
    name: Joi.string().max(255).description("Broadcast name"),
    description: Joi.string()
      .allow("", null)
      .description("Broadcast description"),
    variable_mapping: variableMappingSchema.description(
      "Variable mapping configuration",
    ),
    default_message: defaultMessageSchema.description(
      "Default message configuration",
    ),
    agent_mapping: Joi.object()
      .pattern(Joi.string(), Joi.string().uuid())
      .description("Mapping of template buttons to agent IDs"),
    type: Joi.string()
      .valid("inbound", "outbound")
      .description(
        "Broadcast type - inbound uses keyword matching, outbound uses agent mapping",
      ),
    schedule_type: Joi.string()
      .valid("immediate", "scheduled", "recurring")
      .description("Type of scheduling"),
    scheduled_start: Joi.string()
      .isoDate()
      .description("Scheduled start time (ISO 8601 format)"),
    scheduled_end: Joi.string()
      .isoDate()
      .description(
        "Scheduled end time for recurring broadcasts (ISO 8601 format)",
      ),
    metadata: Joi.object().description("Additional metadata"),
  }).min(1),
};

// Schema for deleting a broadcast
const deleteBroadcastSchema = {
  params: Joi.object({
    broadcast_id: Joi.string().uuid().required().description("Broadcast ID"),
  }),
};

// Schema for updating broadcast status
const updateBroadcastStatusSchema = {
  params: Joi.object({
    broadcast_id: Joi.string().uuid().required().description("Broadcast ID"),
  }),
  body: Joi.object({
    status: Joi.string()
      .required()
      .valid("draft", "scheduled", "active", "paused", "completed", "cancelled")
      .description("Broadcast status"),
  }),
};

// Schema for cloning a broadcast
const cloneBroadcastSchema = {
  params: Joi.object({
    broadcast_id: Joi.string()
      .uuid()
      .required()
      .description("Broadcast ID to clone"),
  }),
  body: Joi.object({
    name: Joi.string()
      .required()
      .max(255)
      .description("Name for the cloned broadcast"),
    scheduled_start: Joi.string()
      .isoDate()
      .description("New scheduled start time (ISO 8601 format)"),
  }),
};

// Schema for getting broadcast analytics
const getBroadcastAnalyticsSchema = {
  params: Joi.object({
    broadcast_id: Joi.string().uuid().required().description("Broadcast ID"),
  }),
  query: Joi.object({
    start_date: Joi.string()
      .isoDate()
      .description("Start date for analytics (ISO 8601)"),
    end_date: Joi.string()
      .isoDate()
      .description("End date for analytics (ISO 8601)"),
    granularity: Joi.string()
      .valid("hourly", "daily")
      .default("hourly")
      .description("Data granularity"),
  }),
};

// Schema for exporting broadcast analytics
const exportBroadcastAnalyticsSchema = {
  params: Joi.object({
    broadcast_id: Joi.string().uuid().required().description("Broadcast ID"),
  }),
  query: Joi.object({
    format: Joi.string()
      .valid("csv", "xlsx")
      .default("csv")
      .description("Export format"),
    include_recipients: Joi.boolean()
      .default(false)
      .description("Whether to include recipient details"),
    include_messages: Joi.boolean()
      .default(false)
      .description("Whether to include message content"),
  }),
};

// Schema for retargeting failed recipients
const retargetFailedRecipientsSchema = {
  params: Joi.object({
    broadcast_id: Joi.string()
      .uuid()
      .required()
      .description("Original broadcast ID"),
  }),
  body: Joi.object({
    name: Joi.string()
      .required()
      .max(255)
      .description("Name for the new retargeting broadcast"),
    scheduled_start: Joi.string()
      .isoDate()
      .description("Scheduled start time for the new broadcast (ISO 8601)"),
    include_undelivered: Joi.boolean()
      .default(true)
      .description("Whether to include undelivered messages"),
    include_errors: Joi.boolean()
      .default(true)
      .description("Whether to include failed messages with errors"),
  }),
};

// Schema validation options
const options = {
  abortEarly: false,
  stripUnknown: true,
};

module.exports = {
  createBroadcastSchema,
  updateBroadcastSchema,
  deleteBroadcastSchema,
  updateBroadcastStatusSchema,
  cloneBroadcastSchema,
  getBroadcastAnalyticsSchema,
  exportBroadcastAnalyticsSchema,
  retargetFailedRecipientsSchema,
  options,
};
