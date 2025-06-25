// api/Templates/schema.js
const { Joi } = require("celebrate");

// Define allowed categories
const ALLOWED_CATEGORIES = ["utility", "authentication", "marketing"];

// Define allowed button types
const ALLOWED_BUTTON_TYPES = ["quick_reply", "url", "phone", "copy"];

// Define allowed header types
const ALLOWED_HEADER_TYPES = ["text", "image", "document", "video", "location"];

// Define button schema for reuse
const buttonSchema = Joi.object({
    type: Joi.string()
        .valid(...ALLOWED_BUTTON_TYPES)
        .required(),
    text: Joi.string().required().max(20),
    value: Joi.string().when("type", {
        is: Joi.valid("url", "phone", "copy"),
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
    id: Joi.string().when("type", {
        is: "quick_reply",
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
});

// Define header schema for reuse
const headerSchema = Joi.object({
    type: Joi.string().valid(...ALLOWED_HEADER_TYPES),
    text: Joi.string().max(60).when("type", {
        is: "text",
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
    media_url: Joi.string()
        .uri()
        .when("type", {
            is: Joi.valid("text", "location"),
            then: Joi.optional(),
            otherwise: Joi.required(),
        }),
    filename: Joi.string().optional(),
    example: Joi.object({
        location: Joi.object({
            latitude: Joi.string().required(),
            longitude: Joi.string().required(),
            name: Joi.string().required(),
            address: Joi.string().required(),
        }),
    }).when("type", {
        is: "location",
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
});

// Define carousel card schema
const carouselCardSchema = Joi.object({
    header: headerSchema.optional(),
    body: Joi.object({
        text: Joi.string().required().max(1024),
    }).required(),
    buttons: Joi.array().items(buttonSchema).max(3).optional(),
});

// Template creation schema
const createTemplateSchema = {
    body: Joi.object({
        template_name: Joi.string()
            .required()
            .max(128)
            .pattern(/^[a-zA-Z0-9_]+$/)
            .description("Template name - alphanumeric and underscores only"),
        category: Joi.string()
            .required()
            .valid(...ALLOWED_CATEGORIES)
            .description("Template category"),
        languages: Joi.array()
            .items(Joi.string().min(2).max(10))
            .required()
            .description("Array of ISO language codes"),
        business_channel: Joi.string()
            .uuid()
            .required()
            .description("Business channel provider ID"),
        content: Joi.object({
            header: headerSchema.optional(),
            body: Joi.object({
                text: Joi.string().required().max(1024),
            }).required(),
            footer: Joi.object({
                text: Joi.string().max(60),
            }).optional(),
            buttons: Joi.array().items(buttonSchema).max(3).optional(),
            carousel: Joi.object({
                cards: Joi.array()
                    .items(carouselCardSchema)
                    .min(1)
                    .max(10)
                    .required(),
            }).optional(),
            list: Joi.object({
                button_text: Joi.string().max(20).required(),
                sections: Joi.array()
                    .items(
                        Joi.object({
                            title: Joi.string().max(24).required(),
                            rows: Joi.array()
                                .items(
                                    Joi.object({
                                        id: Joi.string().required(),
                                        title: Joi.string().max(24).required(),
                                        description: Joi.string()
                                            .max(72)
                                            .optional(),
                                    }),
                                )
                                .min(1)
                                .max(10)
                                .required(),
                        }),
                    )
                    .min(1)
                    .max(10)
                    .required(),
            }).optional(),
        }).required(),
        placeholders: Joi.array()
            .items(
                Joi.object({
                    index: Joi.string().required(),
                    name: Joi.string().required(),
                    example: Joi.string().required(),
                    component: Joi.string()
                        .valid("header", "body", "footer")
                        .required(),
                }),
            )
            .optional(),
    }),
};

// Template update schema
const updateTemplateSchema = {
    body: Joi.object({
        template_name: Joi.string()
            .max(128)
            .pattern(/^[a-zA-Z0-9_]+$/),
        category: Joi.string().valid(...ALLOWED_CATEGORIES),
        description: Joi.string(),
        content: Joi.object({
            header: headerSchema,
            body: Joi.object({
                text: Joi.string().max(1024),
            }),
            footer: Joi.object({
                text: Joi.string().max(60),
            }),
            buttons: Joi.array().items(buttonSchema).max(3),
            carousel: Joi.object({
                cards: Joi.array()
                    .items(carouselCardSchema)
                    .min(1)
                    .max(10)
                    .required(),
            }),
            list: Joi.object({
                button_text: Joi.string().max(20).required(),
                sections: Joi.array()
                    .items(
                        Joi.object({
                            title: Joi.string().max(24).required(),
                            rows: Joi.array()
                                .items(
                                    Joi.object({
                                        id: Joi.string().required(),
                                        title: Joi.string().max(24).required(),
                                        description: Joi.string()
                                            .max(72)
                                            .optional(),
                                    }),
                                )
                                .min(1)
                                .max(10)
                                .required(),
                        }),
                    )
                    .min(1)
                    .max(10),
            }),
        }),
        placeholders: Joi.array().items(
            Joi.object({
                index: Joi.string().required(),
                name: Joi.string().required(),
                example: Joi.string().required(),
                component: Joi.string()
                    .valid("header", "body", "footer")
                    .required(),
            }),
        ),
    }).min(1),
};

// Template query schema
const getTemplatesSchema = {
    query: Joi.object({
        category: Joi.string().valid(...ALLOWED_CATEGORIES),
        status: Joi.string().valid(
            "draft",
            "pending_approval",
            "approved",
            "rejected",
        ),
        language: Joi.string(),
        channel: Joi.string(),
        business_channel: Joi.string(),
        template_type: Joi.string().valid("standard", "carousel", "location"),
        refresh_status: Joi.boolean().default(false),
        page: Joi.number().integer().min(1).default(1),
        per_page: Joi.number().integer().min(1).max(100).default(20),
        sort_by: Joi.string()
            .valid("name", "created_at", "updated_at", "status")
            .default("created_at"),
        sort_order: Joi.string().valid("asc", "desc").default("desc"),
    }),
};

// Schema for template ID parameter
const templateIdSchema = {
    params: Joi.object({
        template_id: Joi.string().uuid().required(),
    }),
};

module.exports = {
    createTemplateSchema,
    updateTemplateSchema,
    getTemplatesSchema,
    templateIdSchema,
    options: {
        abortEarly: false,
        stripUnknown: true,
    },
};
