const Joi = require("joi");

// Schema for channel identifiers
const channelIdentifiersSchema = Joi.object({
  whatsapp: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .description("WhatsApp identifier (phone number)"),
  telegram: Joi.string().description("Telegram username or ID"),
  instagram: Joi.string().description("Instagram username"),
  facebook: Joi.string().description("Facebook ID or username"),
  sms: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .description("SMS phone number"),
  email: Joi.string().email().description("Email address"),
}).unknown(true);

// Schema for contact preferences
const preferencesSchema = Joi.object({
  opt_in: Joi.boolean()
    .default(true)
    .description("Whether the contact has opted in to communications"),
  preferred_channel: Joi.string()
    .valid("whatsapp", "sms", "email", "telegram", "instagram", "facebook")
    .description("Preferred communication channel"),
  communication_frequency: Joi.string()
    .valid("daily", "weekly", "monthly", "quarterly")
    .description("Preferred communication frequency"),
  language: Joi.string().min(2).max(10).description("Preferred language code"),
  time_zone: Joi.string().description("Contact's time zone"),
  do_not_disturb: Joi.object({
    active: Joi.boolean().default(false),
    start_time: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .description("Start time in HH:MM format"),
    end_time: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .description("End time in HH:MM format"),
  }).description("Do not disturb settings"),
  message: Joi.object({
    allow: Joi.array().items(Joi.string()).description("Allowed message types"),
    not_allow: Joi.array()
      .items(Joi.string())
      .description("Disallowed message types"),
  }).description("Message preferences"),
}).unknown(true);

// Schema for creating/updating a contact
const contactSchema = Joi.object({
  first_name: Joi.string().max(100).required(),
  last_name: Joi.string().max(100).required(),
  phone: Joi.string()
    .pattern(/^[1-9]\d{7,14}$/)
    .message(
      "Phone number must be 8 to 15 digits, without '+' or country code prefix"
    )
    .required(),
  country_code: Joi.string().min(2).max(10).required().default("+91"),
  email: Joi.string().email(),
  contact_group_id: Joi.string().uuid().allow(null, ""),
  channel_identifiers: channelIdentifiersSchema.default({}),
  preferences: preferencesSchema.default({}),
  metadata: Joi.object().default({}),
});

// Schema for updating a contact
const updateContactSchema = Joi.object({
  first_name: Joi.string().max(100),
  last_name: Joi.string().max(100),
  phone: Joi.string()
    .pattern(/^[1-9]\d{7,14}$/)
    .message(
      "Phone number must be 8 to 15 digits, without '+' or country code prefix"
    )
    .required(),
  country_code: Joi.string().min(2).max(10).default("+91"),
  email: Joi.string().email(),
  contact_group_id: Joi.string().uuid().allow(null, ""),
  channel_identifiers: channelIdentifiersSchema,
  preferences: preferencesSchema,
  metadata: Joi.object(),
}).min(1);

// Schema for creating a contact group
const contactGroupSchema = Joi.object({
  name: Joi.string().max(255).required(),
  description: Joi.string().allow(null, ""),
});

// Schema for updating a contact group
const updateContactGroupSchema = Joi.object({
  name: Joi.string().max(255),
  description: Joi.string().allow(null, ""),
}).min(1);

// Schema for bulk upload
const bulkUploadSchema = Joi.object({
  contact_group_id: Joi.string().uuid().allow(null, ""),
  create_new_group: Joi.boolean().default(false),
  new_group_name: Joi.string()
    .max(255)
    .when("create_new_group", {
      is: true,
      then: Joi.required(),
      otherwise: Joi.allow(null, ""),
    }),
});

// Schema for querying contacts
const contactQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().allow(""),
  group_id: Joi.string().uuid().allow(null, ""),
  sort_by: Joi.string()
    .valid("first_name", "last_name", "email", "phone", "created_at")
    .default("created_at"),
  sort_order: Joi.string().valid("asc", "desc").default("desc"),
});

// Schema for querying contact groups
const contactGroupQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().allow(""),
  sort_by: Joi.string().valid("name", "created_at").default("created_at"),
  sort_order: Joi.string().valid("asc", "desc").default("desc"),
});

// Field validation rules schema based on field type
const validationRulesSchema = Joi.alternatives().conditional("field_type", [
  {
    is: "text",
    then: Joi.object({
      min_length: Joi.number().integer().min(0),
      max_length: Joi.number().integer().min(1),
      pattern: Joi.string(),
      allowed_values: Joi.array().items(Joi.string()),
    }),
  },
  {
    is: "number",
    then: Joi.object({
      min: Joi.number(),
      max: Joi.number(),
      integer_only: Joi.boolean(),
    }),
  },
  {
    is: "date",
    then: Joi.object({
      min_date: Joi.date().iso(),
      max_date: Joi.date().iso(),
      format: Joi.string(),
    }),
  },
  {
    is: "boolean",
    then: Joi.object({
      true_label: Joi.string(),
      false_label: Joi.string(),
    }),
  },
  {
    is: "select",
    then: Joi.object({
      options: Joi.array().items(Joi.string()).min(1).required(),
      multiple: Joi.boolean().default(false),
    }),
  },
  {
    is: "email",
    then: Joi.object({
      allowed_domains: Joi.array().items(Joi.string()),
    }),
  },
  {
    is: "phone",
    then: Joi.object({
      allowed_country_codes: Joi.array().items(Joi.string()),
    }),
  },
]);

// Contact group field creation schema
const contactGroupFieldSchema = Joi.object({
  name: Joi.string().max(100).required(),
  field_type: Joi.string()
    .valid("text", "number", "date", "boolean", "select", "email", "phone")
    .required(),
  is_required: Joi.boolean().default(false),
  default_value: Joi.string().allow(null, ""),
  validation_rules: Joi.when("field_type", {
    is: Joi.exist(),
    then: validationRulesSchema,
    otherwise: Joi.object().default({}),
  }),
});

// Contact group field update schema
const updateContactGroupFieldSchema = Joi.object({
  name: Joi.string().max(100),
  field_type: Joi.string().valid(
    "text",
    "number",
    "date",
    "boolean",
    "select",
    "email",
    "phone"
  ),
  is_required: Joi.boolean(),
  default_value: Joi.string().allow(null, ""),
  validation_rules: Joi.when("field_type", {
    is: Joi.exist(),
    then: validationRulesSchema,
    otherwise: Joi.object(),
  }),
}).min(1);

// Schema for updating channel identifiers
const updateChannelIdentifiersSchema = Joi.object({
  channel_identifiers: channelIdentifiersSchema.required(),
});

// Schema for updating contact preferences
const updatePreferencesSchema = Joi.object({
  preferences: preferencesSchema.required(),
});

// Schema for adding a contact to a group with field values
const addContactToGroupSchema = Joi.object({
  field_values: Joi.object().default({}),
});

// Schema for updating contact field values in a group
const updateContactFieldValuesSchema = Joi.object({
  field_values: Joi.object().required(),
});

// Schema for validating field values against field definitions
const validateFieldValuesSchema = Joi.object({
  contact_group_id: Joi.string().uuid().required(),
  field_values: Joi.object().required(),
});

module.exports = {
  contactSchema,
  updateContactSchema,
  contactGroupSchema,
  updateContactGroupSchema,
  bulkUploadSchema,
  contactQuerySchema,
  contactGroupQuerySchema,
  contactGroupFieldSchema,
  updateContactGroupFieldSchema,
  channelIdentifiersSchema,
  preferencesSchema,
  updateChannelIdentifiersSchema,
  updatePreferencesSchema,
  addContactToGroupSchema,
  updateContactFieldValuesSchema,
  validateFieldValuesSchema,
};
