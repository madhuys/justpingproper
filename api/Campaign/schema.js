const { Joi } = require("celebrate");

// Define validation for aggregation item
const aggregationItemSchema = Joi.object({
    name: Joi.string()
        .required()
        .max(100)
        .description("Aggregation field name"),
    description: Joi.string().allow("", null).description("Field description"),
    mandatory: Joi.boolean()
        .default(false)
        .description("Whether the field is mandatory"),
    validation: Joi.string()
        .allow("", null)
        .pattern(/^\/.*\/[gimsuy]*$/)
        .description(
            "Validation regex pattern for the field (e.g. '/^[0-9]+$/g')",
        ),
});

// Schema for creating a new campaign
const createCampaignSchema = {
    body: Joi.object({
        name: Joi.string().required().max(255).description("Campaign name"),
        description: Joi.string()
            .allow("", null)
            .description("Campaign description"),
        type: Joi.string()
            .required()
            .valid("outbound", "inbound")
            .description("Campaign type"),
        channel_id: Joi.string()
            .uuid()
            .required()
            .description("Channel ID to use for the campaign"),
        metadata: Joi.object().description(
            "Additional metadata for the campaign",
        ),
        aggregation: Joi.array()
            .items(aggregationItemSchema)
            .description("Aggregation fields configuration"),
    }),
};

// Schema for updating a campaign
const updateCampaignSchema = {
    params: Joi.object({
        campaign_id: Joi.string().uuid().required().description("Campaign ID"),
    }),
    body: Joi.object({
        name: Joi.string().max(255).description("Campaign name"),
        description: Joi.string()
            .allow("", null)
            .description("Campaign description"),
        metadata: Joi.object().description(
            "Additional metadata for the campaign",
        ),
        aggregation: Joi.array()
            .items(aggregationItemSchema)
            .description("Aggregation fields configuration"),
    }).min(1),
};

// Schema for getting a campaign by ID
const getCampaignSchema = {
    params: Joi.object({
        campaign_id: Joi.string().uuid().required().description("Campaign ID"),
    }),
};

// Schema for deleting a campaign
const deleteCampaignSchema = {
    params: Joi.object({
        campaign_id: Joi.string().uuid().required().description("Campaign ID"),
    }),
};

// Schema for updating campaign status
const updateCampaignStatusSchema = {
    params: Joi.object({
        campaign_id: Joi.string().uuid().required().description("Campaign ID"),
    }),
    body: Joi.object({
        status: Joi.string()
            .required()
            .valid("draft", "active", "paused", "completed")
            .description("New campaign status"),
    }),
};

// Schema for listing campaigns with query filters
const listCampaignsSchema = {
    query: Joi.object({
        type: Joi.string()
            .valid("outbound", "inbound")
            .description("Filter by campaign type"),
        status: Joi.string()
            .valid("draft", "active", "paused", "completed")
            .description("Filter by campaign status"),
        page: Joi.number()
            .integer()
            .min(1)
            .default(1)
            .description("Page number"),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(20)
            .description("Number of results per page"),
        sort: Joi.string()
            .valid("created_at", "name", "updated_at")
            .default("created_at")
            .description("Field to sort by"),
        sort_order: Joi.string()
            .valid("asc", "desc")
            .default("desc")
            .description("Sort direction"),
    }),
};

// Schema validation options
const options = {
    abortEarly: false,
    stripUnknown: true,
};

module.exports = {
    createCampaignSchema,
    updateCampaignSchema,
    getCampaignSchema,
    deleteCampaignSchema,
    updateCampaignStatusSchema,
    listCampaignsSchema,
    options,
};
