// api/Channel/schema.js
const { Joi } = require("celebrate");

// Channel creation schema
const channelSchema = {
    body: Joi.object().keys({
        name: Joi.string().required().max(50).description("Channel name"),
        description: Joi.string().optional().description("Channel description"),
        providers_config_schema: Joi.array()
            .items(
                Joi.object({
                    name: Joi.string().required().description("Provider name"),
                    required: Joi.array()
                        .items(Joi.string())
                        .description("Provider required fields"),
                    properties: Joi.object().description(
                        "Provider config schema",
                    ),
                }),
            )
            .required(),
    }),
};

// Channel update schema
const updateChannelSchema = {
    body: Joi.object()
        .keys({
            name: Joi.string().max(50).description("Channel name"),
            description: Joi.string()
                .optional()
                .description("Channel description"),
            providers_config_schema: Joi.array()
                .items(
                    Joi.object({
                        id: Joi.string().optional().description("Provider ID"),
                        name: Joi.string()
                            .required()
                            .description("Provider name"),
                        required: Joi.array()
                            .items(Joi.string())
                            .description("Provider required fields"),
                        properties: Joi.object().description(
                            "Provider config schema",
                        ),
                    }),
                )
                .optional()
                .description(
                    "Configuration schema for the channel with provider definitions",
                ),
        })
        .min(1), // At least one field must be provided for update
    params: Joi.object().keys({
        channelId: Joi.string().uuid().required().description("Channel ID"),
    }),
};

// Channel id parameter schema
const channelIdSchema = {
    params: Joi.object().keys({
        channelId: Joi.string().uuid().required().description("Channel ID"),
    }),
};

// Business channel creation schema
const businessChannelSchema = {
    body: Joi.object().keys({
        channel_id: Joi.string().uuid().required().description("Channel ID"),
        provider_id: Joi.string()
            .uuid()
            .required()
            .description("Provider ID from channel config_schema"),
        name: Joi.string()
            .required()
            .max(100)
            .description("Unique name for the channel configuration"),
        description: Joi.string()
            .optional()
            .description("Channel configuration description"),
        config: Joi.object()
            .required()
            .description("Channel-specific configuration"),
    }),
};

// Business channel update schema
const updateBusinessChannelSchema = {
    body: Joi.object()
        .keys({
            provider_id: Joi.string().optional().description("Provider ID"),
            name: Joi.string()
                .optional()
                .max(100)
                .description("Configuration name"),
            description: Joi.string()
                .optional()
                .description("Configuration description"),
            status: Joi.string()
                .valid("active", "inactive", "pending")
                .optional()
                .description("Channel status"),
            config: Joi.object()
                .optional()
                .description("Channel-specific configuration"),
        })
        .min(1), // At least one field must be provided for update
    params: Joi.object().keys({
        businessChannelId: Joi.string()
            .uuid()
            .required()
            .description("Business Channel ID"),
    }),
};

// Business channel ID parameter schema
const businessChannelIdSchema = {
    params: Joi.object().keys({
        businessChannelId: Joi.string()
            .uuid()
            .required()
            .description("Business Channel ID"),
    }),
};

// Meta webhook verification schema
const metaVerifySchema = {
    query: Joi.object().keys({
        "hub.mode": Joi.string().required(),
        "hub.verify_token": Joi.string().required(),
        "hub.challenge": Joi.string().required(),
    }),
};

// Wati verification schema
const watiVerifySchema = {
    body: Joi.object().keys({
        api_endpoint_url: Joi.string().uri().required(),
        access_token: Joi.string().required(),
        whatsapp_business_number: Joi.string().required(),
    }),
};

// Gupshup apps schema
const gupshupAppsSchema = {
    query: Joi.object().keys({
        api_key: Joi.string().required(),
    }),
};

// Karix verification schema
const karixVerifySchema = {
    body: Joi.object().keys({
        api_key: Joi.string().required(),
        sender_id: Joi.string().required(),
        api_version: Joi.string().required(),
        api_endpoint: Joi.string().uri().required(),
    }),
};

// Test business channel schema
const testBusinessChannelSchema = {
    params: Joi.object().keys({
        businessChannelId: Joi.string().uuid().required(),
    }),
};

// Schema options
const options = {
    abortEarly: false,
    convert: true,
    stripUnknown: true,
};

module.exports = {
    channelSchema,
    updateChannelSchema,
    channelIdSchema,
    businessChannelSchema,
    updateBusinessChannelSchema,
    businessChannelIdSchema,
    metaVerifySchema,
    watiVerifySchema,
    gupshupAppsSchema,
    karixVerifySchema,
    testBusinessChannelSchema,
    options,
};
