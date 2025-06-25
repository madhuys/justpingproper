const boom = require("@hapi/boom");
const logger = require("../../system/utils/logger");
const { transaction } = require("../../system/db/database");
const Template = require("../../system/models/Template");
const TemplateComponent = require("../../system/models/TemplateComponent");
const TemplateButton = require("../../system/models/TemplateButton");
const TemplateMedia = require("../../system/models/TemplateMedia");
const TemplateProvider = require("../../system/models/TemplateProvider");
const Language = require("../../system/models/Language");
const Business = require("../../system/models/Business");
const BusinessChannel = require("../../system/models/BusinessChannel");

// Import provider-specific services
const metaTemplateService = require("../../system/providers/Meta/templates");
const karixTemplateService = require("../../system/providers/Karix/templates");
const gupshupTemplateService = require("../../system/providers/Gupshup/templates");

/**
 * Get language ID from language code
 * @param {string} languageCode - ISO language code
 * @returns {string} Language ID
 */
async function getLanguageIdFromCode(languageCode) {
    try {
        const language = await Language.query()
            .where("code", languageCode)
            .first();
        if (!language) {
            throw boom.notFound(`Language code ${languageCode} not found`);
        }
        return language.id;
    } catch (error) {
        logger.error(
            `Error finding language with code ${languageCode}:`,
            error,
        );
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Error processing language code");
    }
}

/**
 * Convert template data to Meta format with support for carousel and location
 * @param {Object} templateData - Template data
 * @returns {Object} Data formatted for Meta API
 */
function convertToMetaFormat(templateData) {
    // Implementation specific to Meta's API format
    const payload = {
        name: templateData.template_name,
        category: templateData.category.toUpperCase(),
        components: [],
    };

    // Add header component if present
    if (templateData.content.header) {
        const headerComponent = {
            type: "HEADER",
            format: templateData.content.header.type.toUpperCase(),
            text: templateData.content.header.text,
        };

        if (
            headerComponent.format === "LOCATION" &&
            templateData.content.header.example
        ) {
            // Handle location header type
            headerComponent.example = {
                header_handle: ["LOCATION"],
            };
        } else if (
            headerComponent.format !== "TEXT" &&
            templateData.content.header.media_url
        ) {
            // Handle media header types (IMAGE, VIDEO, DOCUMENT)
            headerComponent.example = {
                header_url: [templateData.content.header.media_url],
            };
        }

        payload.components.push(headerComponent);
    }

    // Add body component
    const bodyComponent = {
        type: "BODY",
        text: templateData.content.body.text,
    };

    // Only add example values if there are placeholders in the body text
    if (templateData.content.body.text.includes("{{")) {
        bodyComponent.example = {
            body_text: generateExampleValues(templateData),
        };
    }

    payload.components.push(bodyComponent);

    // Add carousel if present
    if (
        templateData.content.carousel &&
        templateData.content.carousel.cards &&
        templateData.content.carousel.cards.length > 0
    ) {
        // For Meta, carousel cards are added as a special component
        const carouselComponent = {
            type: "CAROUSEL",
            cards: templateData.content.carousel.cards.map((card) => {
                const carouselCard = {
                    components: [],
                };

                // Add card header if present
                if (card.header) {
                    const cardHeader = {
                        type: "HEADER",
                        format: card.header.type.toUpperCase(),
                    };

                    if (cardHeader.format !== "TEXT" && card.header.media_url) {
                        cardHeader.example = {
                            header_url: [card.header.media_url],
                        };
                    } else if (
                        cardHeader.format === "TEXT" &&
                        card.header.text
                    ) {
                        cardHeader.text = card.header.text;
                    }

                    carouselCard.components.push(cardHeader);
                }

                // Add card body (required)
                if (card.body) {
                    // Extract placeholders from this card's body text
                    const cardPlaceholders = extractPlaceholdersFromText(
                        card.body.text,
                    );

                    const cardBodyComponent = {
                        type: "BODY",
                        text: card.body.text,
                    };

                    // Only add example values if there are placeholders in the card body text
                    if (
                        cardPlaceholders.length > 0 &&
                        templateData.placeholders
                    ) {
                        const cardExampleValues = [];

                        // Map each placeholder to its corresponding example value
                        cardPlaceholders.forEach((placeholder) => {
                            // Extract the index from {{N}} format
                            const placeholderIndex = placeholder.substring(
                                2,
                                placeholder.length - 2,
                            );

                            // Find the matching placeholder in the template data
                            const placeholderObj =
                                templateData.placeholders.find(
                                    (p) => p.index === placeholderIndex,
                                );

                            // Add the example value if found
                            if (placeholderObj) {
                                cardExampleValues.push(placeholderObj.example);
                            } else {
                                cardExampleValues.push("Example");
                            }
                        });

                        // Add examples specifically for this carousel card
                        if (cardExampleValues.length > 0) {
                            cardBodyComponent.example = {
                                body_text: [cardExampleValues],
                            };
                        }
                    }

                    carouselCard.components.push(cardBodyComponent);
                }

                // Add card buttons if present
                if (card.buttons && card.buttons.length > 0) {
                    const cardButtonsComponent = {
                        type: "BUTTONS",
                        buttons: card.buttons.map((button) => {
                            switch (button.type) {
                                case "url":
                                    return {
                                        type: "URL",
                                        text: button.text,
                                        url:
                                            button.value ||
                                            "https://example.com", // Fallback URL
                                    };
                                case "phone":
                                    return {
                                        type: "PHONE_NUMBER",
                                        text: button.text,
                                        phone_number:
                                            button.value || "+1234567890", // Fallback phone number
                                    };
                                case "quick_reply":
                                default:
                                    return {
                                        type: "QUICK_REPLY",
                                        text: button.text,
                                    };
                            }
                        }),
                    };
                    carouselCard.components.push(cardButtonsComponent);
                }

                return carouselCard;
            }),
        };

        payload.components.push(carouselComponent);
    }

    // Add footer if present
    if (templateData.content.footer) {
        payload.components.push({
            type: "FOOTER",
            text: templateData.content.footer.text,
        });
    }

    // Add buttons if present (main template buttons, not carousel card buttons)
    if (
        templateData.content.buttons &&
        templateData.content.buttons.length > 0
    ) {
        const buttonsComponent = {
            type: "BUTTONS",
            buttons: templateData.content.buttons.map((button) => {
                switch (button.type) {
                    case "url":
                        return {
                            type: "URL",
                            text: button.text,
                            url: button.value || "https://example.com", // Fallback URL
                        };
                    case "phone":
                        return {
                            type: "PHONE_NUMBER",
                            text: button.text,
                            phone_number: button.value || "+1234567890", // Fallback phone number
                        };
                    case "quick_reply":
                    default:
                        return {
                            type: "QUICK_REPLY",
                            text: button.text,
                        };
                }
            }),
        };
        payload.components.push(buttonsComponent);
    }

    return payload;
}

/**
 * Convert template data to Karix format with support for carousel and location
 * @param {Object} templateData - Template data
 * @param {string} wabaId - WhatsApp Business Account ID
 * @param {string} apiKey - API Key
 * @returns {Object} Data formatted for Karix API
 */
async function convertToKarixFormat(templateData, wabaId, apiKey) {
    // Implementation specific to Karix's API format
    const payload = {
        template_name: templateData.template_name,
        category: templateData.category.toUpperCase(),
        language: templateData.languages[0],
        components: [],
    };

    // Add namespace if present in templateData
    if (templateData.namespace) {
        payload.namespace = templateData.namespace;
    }

    // Add header component if present
    if (templateData.content.header) {
        const headerComponent = {
            type: "HEADER",
            format: templateData.content.header.type.toUpperCase(),
        };

        if (headerComponent.format === "TEXT") {
            headerComponent.text = templateData.content.header.text;
        } else if (
            headerComponent.format === "LOCATION" &&
            templateData.content.header.example
        ) {
            // Handle location header type
            headerComponent.example = {
                header_handle: ["LOCATION"],
            };
        } else {
            // For media types (IMAGE, VIDEO, DOCUMENT)
            try {
                const media_url = await karixTemplateService.uploadMediaFromUrl(
                    templateData.content.header.media_url,
                    wabaId,
                    apiKey,
                );
                headerComponent.example = {
                    header_handle: [media_url],
                };
            } catch (error) {
                logger.error(
                    `Error uploading media to Karix: ${error.message}`,
                );
                throw boom.badImplementation(
                    `Failed to upload media: ${error.message}`,
                );
            }
        }

        payload.components.push(headerComponent);
    }

    // Add body component (required)
    const bodyComponent = {
        type: "BODY",
        text: templateData.content.body.text,
    };

    // Add example values for body variables only if there are placeholders in the text
    if (templateData.content.body.text.includes("{{")) {
        const exampleValues = generateExampleValues(templateData);
        if (exampleValues.length > 0) {
            bodyComponent.example = {
                body_text: exampleValues,
            };
        }
    }

    payload.components.push(bodyComponent);

    // Add carousel if present
    if (
        templateData.content.carousel &&
        templateData.content.carousel.cards &&
        templateData.content.carousel.cards.length > 0
    ) {
        // For Karix, carousel cards are added as a special component
        const carouselComponent = {
            type: "CAROUSEL",
            cards: [],
        };

        // Process each card in the carousel
        for (const card of templateData.content.carousel.cards) {
            const carouselCard = {
                components: [],
            };

            // Add card header if present
            if (card.header) {
                const cardHeader = {
                    type: "HEADER",
                    format: card.header.type.toUpperCase(),
                };

                if (cardHeader.format === "TEXT" && card.header.text) {
                    cardHeader.text = card.header.text;
                } else if (card.header.media_url) {
                    // Upload media for card header
                    try {
                        const media_url =
                            await karixTemplateService.uploadMediaFromUrl(
                                card.header.media_url,
                                wabaId,
                                apiKey,
                            );
                        cardHeader.example = {
                            header_handle: [media_url],
                        };
                    } catch (error) {
                        logger.error(
                            `Error uploading carousel card media to Karix: ${error.message}`,
                        );
                        throw boom.badImplementation(
                            `Failed to upload carousel card media: ${error.message}`,
                        );
                    }
                }

                carouselCard.components.push(cardHeader);
            }

            // Add card body (required)
            if (card.body) {
                const cardBodyComponent = {
                    type: "BODY",
                    text: card.body.text,
                };

                // Extract placeholders from this card's body text
                const cardPlaceholders = extractPlaceholdersFromText(
                    card.body.text,
                );

                // Find examples for these placeholders if the card body contains placeholders
                if (cardPlaceholders.length > 0 && templateData.placeholders) {
                    const cardExampleValues = [];

                    // Map each placeholder to its corresponding example value
                    cardPlaceholders.forEach((placeholder) => {
                        // Extract the index from {{N}} format
                        const placeholderIndex = placeholder.substring(
                            2,
                            placeholder.length - 2,
                        );

                        // Find the matching placeholder in the template data
                        const placeholderObj = templateData.placeholders.find(
                            (p) => p.index === placeholderIndex,
                        );

                        // Add the example value if found
                        if (placeholderObj) {
                            cardExampleValues.push(placeholderObj.example);
                        } else {
                            cardExampleValues.push("Example");
                        }
                    });

                    // Add examples specifically for this carousel card
                    if (cardExampleValues.length > 0) {
                        cardBodyComponent.example = {
                            body_text: [cardExampleValues],
                        };
                    }
                }

                carouselCard.components.push(cardBodyComponent);
            }

            // Add card buttons if present
            if (card.buttons && card.buttons.length > 0) {
                const cardButtonsComponent = {
                    type: "BUTTONS",
                    buttons: card.buttons.map((button) => {
                        switch (button.type.toLowerCase()) {
                            case "url":
                                return {
                                    type: "URL",
                                    text: button.text,
                                    url: button.value || "https://justping.ai", // Fallback URL
                                };
                            case "phone":
                                return {
                                    type: "PHONE_NUMBER",
                                    text: button.text,
                                    phone_number: button.value || "+9181", // Fallback phone number
                                };
                            case "quick_reply":
                            default:
                                return {
                                    type: "QUICK_REPLY",
                                    text: button.text,
                                };
                        }
                    }),
                };
                carouselCard.components.push(cardButtonsComponent);
            }

            carouselComponent.cards.push(carouselCard);
        }

        payload.components.push(carouselComponent);
    }

    // Add footer if present
    if (templateData.content.footer) {
        payload.components.push({
            type: "FOOTER",
            text: templateData.content.footer.text,
        });
    }

    // Add buttons if present (main template buttons, not carousel card buttons)
    if (
        templateData.content.buttons &&
        templateData.content.buttons.length > 0
    ) {
        const buttonsComponent = {
            type: "BUTTONS",
            buttons: templateData.content.buttons.map((button) => {
                switch (button.type.toLowerCase()) {
                    case "url":
                        return {
                            type: "URL",
                            text: button.text,
                            url: button.value || "https://example.com", // Fallback URL
                        };
                    case "phone":
                        return {
                            type: "PHONE_NUMBER",
                            text: button.text,
                            phone_number: button.value || "+1234567890", // Fallback phone number
                        };
                    case "quick_reply":
                    default:
                        return {
                            type: "QUICK_REPLY",
                            text: button.text,
                        };
                }
            }),
        };
        payload.components.push(buttonsComponent);
    }

    return payload;
}

/**
 * Extract placeholder patterns like {{1}}, {{2}} from text
 * @param {string} text - Text to analyze
 * @returns {Array} List of placeholder patterns found
 */
function extractPlaceholdersFromText(text) {
    const placeholderRegex = /\{\{(\d+)\}\}/g;
    const matches = [];
    let match;

    while ((match = placeholderRegex.exec(text)) !== null) {
        matches.push(match[0]);
    }

    return matches;
}

/**
 * Convert template data to Gupshup format with support for carousel and location
 * @param {Object} templateData - Template data
 * @returns {Object} Data formatted for Gupshup API
 */
function convertToGupshupFormat(templateData) {
    // Base payload structure for Gupshup
    const payload = {
        template: templateData.template_name,
        category: templateData.category,
        languageCode: templateData.languages[0],
        content: templateData.content.body.text,
        example: generateExampleValues(templateData)[0] || [],
        vertical: "OTHER", // Default vertical
    };

    // Handle special components like header
    if (templateData.content.header) {
        const headerType = templateData.content.header.type.toUpperCase();

        // Add header type metadata
        payload.headerType = headerType;

        // Add specific header details based on type
        if (headerType === "LOCATION" && templateData.content.header.example) {
            payload.locationExample =
                templateData.content.header.example.location;
        } else if (
            headerType !== "TEXT" &&
            templateData.content.header.media_url
        ) {
            payload.mediaUrl = templateData.content.header.media_url;
        }
    }

    // Handle carousel for Gupshup if present
    if (templateData.content.carousel && templateData.content.carousel.cards) {
        payload.isCarousel = true;
        payload.carouselCards = templateData.content.carousel.cards.map(
            (card) => {
                const cardData = {
                    bodyText: card.body?.text || "",
                };

                // Add card header information
                if (card.header) {
                    cardData.headerType = card.header.type.toUpperCase();
                    if (
                        cardData.headerType !== "TEXT" &&
                        card.header.media_url
                    ) {
                        cardData.mediaUrl = card.header.media_url;
                    }
                }

                // Add card buttons
                if (card.buttons && card.buttons.length > 0) {
                    cardData.buttons = card.buttons.map((button) => ({
                        type: button.type.toUpperCase(),
                        text: button.text,
                        value: button.value || button.id,
                    }));
                }

                return cardData;
            },
        );
    }

    // Handle footer if present
    if (templateData.content.footer) {
        payload.footer = templateData.content.footer.text;
    }

    // Handle buttons if present (main template buttons)
    if (
        templateData.content.buttons &&
        templateData.content.buttons.length > 0
    ) {
        payload.buttons = templateData.content.buttons.map((button) => ({
            type: button.type.toUpperCase(),
            text: button.text,
            value: button.value || button.id,
        }));
    }

    return payload;
}

/**
 * Generate example values for template variables, handling carousel placeholders
 * @param {Object} templateData - Template data
 * @returns {Array} Example values for template variables
 */
function generateExampleValues(templateData) {
    if (!templateData.placeholders || !templateData.placeholders.length) {
        return [];
    }

    // Collect example values for placeholders
    const examples = templateData.placeholders.map(
        (placeholder) => placeholder.example,
    );

    return [examples]; // Return as an array of arrays
}

/**
 * Creates or updates the template components in the database, including carousel and location support
 * @param {Object} trx - Transaction object
 * @param {string} templateId - Template ID
 * @param {Object} data - Template data
 * @returns {Promise<Array>} Created components
 */
async function createOrUpdateTemplateComponents(trx, templateId, data) {
    const components = [];

    // Create header component if present
    if (data.content.header) {
        const headerComponent = await TemplateComponent.query(trx).insert({
            template_id: templateId,
            component_type: "header",
            content: data.content.header.text || "",
            sequence: 0,
            metadata: data.content.header,
        });
        components.push(headerComponent);

        // If it's a location header, store the location data
        if (
            data.content.header.type === "location" &&
            data.content.header.example
        ) {
            await TemplateMedia.query(trx).insert({
                template_id: templateId,
                media_type: "location",
                metadata: data.content.header.example,
                caption: data.content.header.text || null,
            });
        }
        // If it's a media header, store the media url
        else if (
            data.content.header.type !== "text" &&
            data.content.header.media_url
        ) {
            await TemplateMedia.query(trx).insert({
                template_id: templateId,
                media_type: data.content.header.type,
                url: data.content.header.media_url,
                caption: data.content.header.text || null,
                filename: data.content.header.filename || null,
            });
        }
    }

    // Body component (required)
    const bodyComponent = await TemplateComponent.query(trx).insert({
        template_id: templateId,
        component_type: "body",
        content: data.content.body.text,
        sequence: 1,
    });
    components.push(bodyComponent);

    // Add buttons if present (main template buttons)
    if (data.content.buttons && data.content.buttons.length > 0) {
        for (let i = 0; i < data.content.buttons.length; i++) {
            const button = data.content.buttons[i];
            await TemplateButton.query(trx).insert({
                template_component_id: bodyComponent.id,
                button_type: button.type,
                text: button.text,
                payload: button.value || button.id,
                sequence: i,
            });
        }
    }

    // Handle carousel component if present
    if (
        data.content.carousel &&
        data.content.carousel.cards &&
        data.content.carousel.cards.length > 0
    ) {
        const carouselComponent = await TemplateComponent.query(trx).insert({
            template_id: templateId,
            component_type: "carousel",
            content: JSON.stringify(data.content.carousel),
            sequence: 2,
            metadata: {
                card_count: data.content.carousel.cards.length,
            },
        });
        components.push(carouselComponent);

        // Store each carousel card's media if present
        for (let i = 0; i < data.content.carousel.cards.length; i++) {
            const card = data.content.carousel.cards[i];

            // Create a card component that will be linked to the carousel
            const cardComponent = await TemplateComponent.query(trx).insert({
                template_id: templateId,
                component_type: "carousel_card",
                content: card.body?.text || "",
                sequence: i,
                parent_component_id: carouselComponent.id,
                metadata: { card_index: i },
            });

            // Add card media if present
            if (
                card.header &&
                card.header.type !== "text" &&
                card.header.media_url
            ) {
                await TemplateMedia.query(trx).insert({
                    template_id: templateId,
                    component_id: cardComponent.id,
                    media_type: card.header.type,
                    url: card.header.media_url,
                    caption: card.header.text || null,
                    filename: card.header.filename || null,
                    metadata: { card_index: i },
                });
            }

            // Add card buttons if present
            if (card.buttons && card.buttons.length > 0) {
                for (let j = 0; j < card.buttons.length; j++) {
                    const button = card.buttons[j];
                    await TemplateButton.query(trx).insert({
                        template_component_id: cardComponent.id,
                        button_type: button.type,
                        text: button.text,
                        payload: button.value || button.id,
                        sequence: j,
                        metadata: { card_index: i },
                    });
                }
            }
        }
    }

    // Add footer component if present
    if (data.content.footer) {
        const footerComponent = await TemplateComponent.query(trx).insert({
            template_id: templateId,
            component_type: "footer",
            content: data.content.footer.text,
            sequence: data.content.carousel ? 3 : 2,
        });
        components.push(footerComponent);
    }

    return components;
}

/**
 * Submit template to the appropriate provider with support for carousel and location
 * @param {string} providerName - Provider name (meta, karix, gupshup, wati)
 * @param {Object} templateData - Template data
 * @param {Object} businessChannel - Business channel configuration
 * @returns {Object} Provider response
 */
async function submitTemplateToProvider(
    providerName,
    templateData,
    businessChannel,
) {
    try {
        const providerConfig = businessChannel.config;
        let result;

        // Normalize the template name to lowercase and replace invalid characters
        templateData.template_name = templateData.template_name
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "_");

        // Log the provider name and config for debugging
        logger.info(`Submitting template to provider: ${providerName}`);
        logger.debug(
            `Business channel config:`,
            JSON.stringify(businessChannel),
        );

        // Validate template structure based on template type
        validateTemplateStructure(templateData);

        // Normalize provider name for case-insensitive comparison
        const normalizedProviderName = providerName.toLowerCase();

        // Handle provider name from business channel if available
        const actualProviderName = businessChannel.provider_name
            ? businessChannel.provider_name.toLowerCase()
            : normalizedProviderName;

        // First check if we're dealing with WhatsApp channel
        if (
            normalizedProviderName === "whatsapp" ||
            normalizedProviderName.includes("wahats")
        ) {
            // Determine which provider to use based on business channel configuration or provider_name
            if (actualProviderName === "karix" || providerConfig.api_key) {
                logger.info("Using Karix service for WhatsApp provider");

                // Add namespace if available
                if (providerConfig.namespace) {
                    templateData.namespace = providerConfig.namespace;
                }

                // Ensure required config values exist
                if (!providerConfig.api_key) {
                    throw boom.badRequest(
                        "Missing Karix API key in business channel configuration",
                    );
                }

                // Use the sender_id as the WhatsApp business account ID if needed
                const whatsappBusinessAccountId =
                    providerConfig.whatsapp_business_account_id ||
                    providerConfig.sender_id;

                if (!whatsappBusinessAccountId) {
                    throw boom.badRequest(
                        "Missing WhatsApp business account ID in configuration",
                    );
                }
                // Convert templateData to Karix format
                const karixPayload = await convertToKarixFormat(
                    templateData,
                    whatsappBusinessAccountId,
                    providerConfig.api_key,
                );
                logger.debug("Karix payload:", JSON.stringify(karixPayload));
                result = await karixTemplateService.createTemplate(
                    providerConfig.api_key,
                    whatsappBusinessAccountId,
                    karixPayload,
                );
            }
            // Check if we have Meta config
            else if (
                providerConfig.meta ||
                providerConfig.access_token ||
                actualProviderName === "meta"
            ) {
                logger.info("Using Meta service for WhatsApp provider");

                // Convert templateData to Meta format
                const metaPayload = convertToMetaFormat(templateData);

                // Determine which config structure to use
                const metaConfig = providerConfig.meta || providerConfig;
                const accessToken = metaConfig.access_token;
                const businessAccountId = metaConfig.business_account_id;

                if (!accessToken) {
                    throw boom.badRequest(
                        "Missing Meta access token in business channel configuration",
                    );
                }

                if (!businessAccountId) {
                    throw boom.badRequest(
                        "Missing Meta business account ID in configuration",
                    );
                }

                result = await metaTemplateService.createTemplate(
                    metaPayload,
                    accessToken,
                    businessAccountId,
                );
            } else {
                throw boom.badRequest(
                    "No valid provider configuration found for WhatsApp",
                );
            }
        }
        // Handle direct provider names
        else {
            switch (actualProviderName) {
                case "meta":
                    // Convert templateData to Meta format
                    const metaPayload = convertToMetaFormat(templateData);

                    if (!providerConfig.access_token) {
                        throw boom.badRequest(
                            "Missing Meta access token in configuration",
                        );
                    }

                    if (!providerConfig.business_account_id) {
                        throw boom.badRequest(
                            "Missing Meta business account ID in configuration",
                        );
                    }

                    result = await metaTemplateService.createTemplate(
                        metaPayload,
                        providerConfig.access_token,
                        providerConfig.business_account_id,
                    );
                    break;

                case "karix":
                    // Add namespace from Karix config if available
                    if (providerConfig.namespace) {
                        templateData.namespace = providerConfig.namespace;
                    }

                    // Ensure required config values exist
                    if (!providerConfig.api_key) {
                        throw boom.badRequest(
                            "Missing Karix API key in business channel configuration",
                        );
                    }

                    // Use sender_id as fallback for whatsapp_business_account_id
                    const wabaId =
                        providerConfig.whatsapp_business_account_id ||
                        providerConfig.sender_id;

                    if (!wabaId) {
                        throw boom.badRequest(
                            "Missing WhatsApp business account ID in configuration",
                        );
                    }

                    // Convert templateData to Karix format
                    const karixPayload = await convertToKarixFormat(
                        templateData,
                        wabaId,
                        providerConfig.api_key,
                    );

                    result = await karixTemplateService.createTemplate(
                        providerConfig.api_key,
                        wabaId,
                        karixPayload,
                    );
                    break;

                case "gupshup":
                    // Convert templateData to Gupshup format
                    const gupshupPayload = convertToGupshupFormat(templateData);

                    if (!providerConfig.api_key) {
                        throw boom.badRequest(
                            "Missing Gupshup API key in configuration",
                        );
                    }

                    if (!providerConfig.app_id) {
                        throw boom.badRequest(
                            "Missing Gupshup app ID in configuration",
                        );
                    }

                    result = await gupshupTemplateService.createGupshupTemplate(
                        gupshupPayload,
                        providerConfig.app_id,
                        providerConfig.api_key,
                    );
                    break;

                case "wati":
                    throw boom.badRequest(
                        "WATI template creation not supported in current implementation",
                    );

                default:
                    throw boom.badRequest(
                        `Provider ${providerName} (${actualProviderName}) not supported`,
                    );
            }
        }

        // Check for errors in provider response
        if (result && result.error) {
            logger.error(
                `Error from provider when submitting template:`,
                result,
            );

            // Extract and format the error message
            let errorMessage =
                "An error occurred while submitting the template.";
            try {
                const providerError =
                    typeof result.error === "string"
                        ? JSON.parse(result.error)
                        : result.error;

                errorMessage =
                    providerError.error?.error_user_msg ||
                    providerError.message ||
                    errorMessage;
            } catch (parseError) {
                logger.error("Error parsing provider error:", parseError);
            }

            throw boom.badRequest(errorMessage);
        }

        return result;
    } catch (error) {
        logger.error(`Error submitting template to ${providerName}:`, error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation(
            `Failed to submit template to ${providerName}: ${error.message}`,
        );
    }
}

function validateTemplateStructure(templateData) {
    // Basic validation for all templates
    if (!templateData.template_name) {
        throw boom.badRequest("Missing template_name");
    }

    if (!templateData.category) {
        throw boom.badRequest("Missing category");
    }

    if (!templateData.languages || !templateData.languages.length) {
        throw boom.badRequest("Missing languages");
    }

    if (!templateData.business_channel) {
        throw boom.badRequest("Missing business_channel");
    }

    if (
        !templateData.content ||
        !templateData.content.body ||
        !templateData.content.body.text
    ) {
        throw boom.badRequest("Missing body content");
    }

    // Check for carousel structure
    if (templateData.content.carousel) {
        if (
            !templateData.content.carousel.cards ||
            !Array.isArray(templateData.content.carousel.cards) ||
            templateData.content.carousel.cards.length === 0
        ) {
            throw boom.badRequest(
                "Invalid carousel structure: cards array is required",
            );
        }

        // Validate each card in the carousel
        templateData.content.carousel.cards.forEach((card, index) => {
            if (!card.body || !card.body.text) {
                throw boom.badRequest(
                    `Invalid carousel card at index ${index}: missing body text`,
                );
            }

            // If header exists, validate it
            if (card.header) {
                if (!card.header.type) {
                    throw boom.badRequest(
                        `Invalid carousel card at index ${index}: missing header type`,
                    );
                }

                // Validate allowed header types
                if (
                    !["text", "image", "video", "document"].includes(
                        card.header.type,
                    )
                ) {
                    throw boom.badRequest(
                        `Invalid carousel card at index ${index}: unsupported header type '${card.header.type}'`,
                    );
                }

                // If header type is media, validate media URL
                if (card.header.type !== "text" && !card.header.media_url) {
                    throw boom.badRequest(
                        `Invalid carousel card at index ${index}: missing media URL for header type ${card.header.type}`,
                    );
                }
            }

            // If buttons exist, validate them
            if (card.buttons) {
                if (!Array.isArray(card.buttons)) {
                    throw boom.badRequest(
                        `Invalid carousel card at index ${index}: buttons must be an array`,
                    );
                }

                // Check button count limits per card
                if (card.buttons.length > 3) {
                    throw boom.badRequest(
                        `Too many buttons in carousel card at index ${index}: maximum allowed is 3`,
                    );
                }

                card.buttons.forEach((button, buttonIndex) => {
                    if (!button.type || !button.text) {
                        throw boom.badRequest(
                            `Invalid carousel card button at index ${index}.${buttonIndex}: missing type or text`,
                        );
                    }

                    // Validate allowed button types
                    if (
                        !["url", "phone", "quick_reply"].includes(button.type)
                    ) {
                        throw boom.badRequest(
                            `Invalid carousel card button at index ${index}.${buttonIndex}: unsupported button type '${button.type}'`,
                        );
                    }

                    // Validate URL buttons have a value
                    if (button.type === "url" && !button.value) {
                        throw boom.badRequest(
                            `Invalid carousel card URL button at index ${index}.${buttonIndex}: missing URL value`,
                        );
                    }

                    // Validate phone buttons have a value
                    if (button.type === "phone" && !button.value) {
                        throw boom.badRequest(
                            `Invalid carousel card phone button at index ${index}.${buttonIndex}: missing phone value`,
                        );
                    }

                    // Validate quick_reply buttons have an ID
                    if (button.type === "quick_reply" && !button.id) {
                        throw boom.badRequest(
                            `Invalid carousel card quick_reply button at index ${index}.${buttonIndex}: missing ID`,
                        );
                    }
                });
            }
        });

        // Check carousel card count limits
        if (templateData.content.carousel.cards.length > 10) {
            throw boom.badRequest(
                "Too many carousel cards: maximum allowed is 10",
            );
        }
    }
    // Check for location header structure
    if (
        templateData.content.header &&
        templateData.content.header.type === "location"
    ) {
        if (
            !templateData.content.header.example ||
            !templateData.content.header.example.location
        ) {
            throw boom.badRequest(
                "Invalid location header: missing example location data",
            );
        }

        const location = templateData.content.header.example.location;
        if (!location.latitude || !location.longitude) {
            throw boom.badRequest(
                "Invalid location header: missing latitude or longitude",
            );
        }

        // Validate latitude and longitude are numeric
        if (
            isNaN(parseFloat(location.latitude)) ||
            isNaN(parseFloat(location.longitude))
        ) {
            throw boom.badRequest(
                "Invalid location header: latitude and longitude must be numeric values",
            );
        }

        if (!location.name) {
            throw boom.badRequest(
                "Invalid location header: missing location name",
            );
        }

        if (!location.address) {
            throw boom.badRequest(
                "Invalid location header: missing location address",
            );
        }
    }

    // Validate header
    if (templateData.content.header) {
        if (!templateData.content.header.type) {
            throw boom.badRequest("Invalid header: missing type");
        }

        // Validate allowed header types
        if (
            !["text", "image", "video", "document", "location"].includes(
                templateData.content.header.type,
            )
        ) {
            throw boom.badRequest(
                `Invalid header: unsupported type '${templateData.content.header.type}'`,
            );
        }

        // Validate media headers
        if (
            ["image", "document", "video"].includes(
                templateData.content.header.type,
            ) &&
            !templateData.content.header.media_url
        ) {
            throw boom.badRequest(
                `Invalid header: missing media URL for ${templateData.content.header.type} type`,
            );
        }
    }

    // Validate main buttons if present
    if (templateData.content.buttons) {
        if (!Array.isArray(templateData.content.buttons)) {
            throw boom.badRequest("Invalid template: buttons must be an array");
        }

        // Check button count limits
        if (templateData.content.buttons.length > 3) {
            throw boom.badRequest("Too many buttons: maximum allowed is 3");
        }

        templateData.content.buttons.forEach((button, index) => {
            if (!button.type || !button.text) {
                throw boom.badRequest(
                    `Invalid button at index ${index}: missing type or text`,
                );
            }

            // Validate allowed button types
            if (
                !["url", "phone", "quick_reply", "copy"].includes(button.type)
            ) {
                throw boom.badRequest(
                    `Invalid button at index ${index}: unsupported button type '${button.type}'`,
                );
            }

            // Validate URL buttons have a value
            if (button.type === "url" && !button.value) {
                throw boom.badRequest(
                    `Invalid URL button at index ${index}: missing URL value`,
                );
            }

            // Validate phone buttons have a value
            if (button.type === "phone" && !button.value) {
                throw boom.badRequest(
                    `Invalid phone button at index ${index}: missing phone value`,
                );
            }

            // Validate quick_reply buttons have an ID
            if (button.type === "quick_reply" && !button.id) {
                throw boom.badRequest(
                    `Invalid quick_reply button at index ${index}: missing ID`,
                );
            }
        });
    }

    // Validate placeholders
    if (templateData.placeholders) {
        if (!Array.isArray(templateData.placeholders)) {
            throw boom.badRequest(
                "Invalid template: placeholders must be an array",
            );
        }

        templateData.placeholders.forEach((placeholder, index) => {
            if (!placeholder.index) {
                throw boom.badRequest(
                    `Invalid placeholder at position ${index}: missing index`,
                );
            }

            if (!placeholder.name) {
                throw boom.badRequest(
                    `Invalid placeholder at position ${index}: missing name`,
                );
            }

            if (!placeholder.example) {
                throw boom.badRequest(
                    `Invalid placeholder at position ${index}: missing example value`,
                );
            }

            if (!placeholder.component) {
                throw boom.badRequest(
                    `Invalid placeholder at position ${index}: missing component reference`,
                );
            }

            // Check if the placeholder index is referenced in the body text
            const bodyText = templateData.content.body.text;
            const placeholderPattern = new RegExp(
                `\\{\\{${placeholder.index}\\}\\}`,
            );

            // Also check carousel card body text if present
            let foundInText = placeholderPattern.test(bodyText);

            if (
                !foundInText &&
                templateData.content.carousel &&
                templateData.content.carousel.cards
            ) {
                foundInText = templateData.content.carousel.cards.some(
                    (card) =>
                        card.body &&
                        card.body.text &&
                        placeholderPattern.test(card.body.text),
                );
            }

            if (!foundInText) {
                throw boom.badRequest(
                    `Placeholder {{${placeholder.index}}} is defined but not used in any text content`,
                );
            }
        });
    }

    // Check if template name follows required format (lowercase alphanumeric and underscores only)
    const templateNameRegex = /^[a-z0-9_]+$/;
    if (!templateNameRegex.test(templateData.template_name)) {
        throw boom.badRequest(
            "Template name must contain only lowercase letters, numbers, and underscores",
        );
    }

    // Check category values against allowed list
    const allowedCategories = [
        "utility",
        "marketing",
        "authentication",
        "alert",
        "customer_service",
        "payment",
        "personal_finance",
        "shipping",
        "appointment_update",
    ];

    if (!allowedCategories.includes(templateData.category.toLowerCase())) {
        throw boom.badRequest(
            `Invalid category: '${
                templateData.category
            }'. Allowed values are: ${allowedCategories.join(", ")}`,
        );
    }

    // Check for template/content inconsistencies

    // If there's a carousel but also main template buttons, warn that they might not be compatible
    if (
        templateData.content.carousel &&
        templateData.content.buttons &&
        templateData.content.buttons.length > 0
    ) {
        logger.warn(
            "Template contains both carousel and main buttons, which may not be supported by all providers",
        );
    }

    // Validate language codes format
    templateData.languages.forEach((langCode, index) => {
        if (!/^[a-z]{2}(_[A-Z]{2})?$/.test(langCode)) {
            throw boom.badRequest(
                `Invalid language code at index ${index}: '${langCode}'. Format should be 'xx' or 'xx_XX'`,
            );
        }
    });
}

/**
 * Helper function to check and update template status
 * @param {Object} template - Template object
 */
async function checkAndUpdateTemplateStatus(template) {
    try {
        // For each provider, check the current status
        for (const provider of template.providers) {
            try {
                // Find the business channel for this business
                const businessChannels = await BusinessChannel.query()
                    .where("business_id", template.business_id)
                    .withGraphFetched("channel");

                if (!businessChannels || businessChannels.length === 0) {
                    logger.warn(
                        `No business channels found for business ID: ${template.business_id}`,
                    );
                    continue;
                }

                // Find the business channel that matches the provider name
                let businessChannel = null;

                for (const bc of businessChannels) {
                    // Check if this business channel is for the provider we're looking for
                    if (
                        bc.channel &&
                        bc.channel.name.toLowerCase() ===
                            provider.provider_name.toLowerCase()
                    ) {
                        businessChannel = bc;
                        break;
                    }

                    // For WhatsApp, check if there's a WhatsApp channel with the right provider
                    if (
                        provider.provider_name.toLowerCase() === "whatsapp" &&
                        bc.channel &&
                        bc.channel.name.toLowerCase() === "whatsapp"
                    ) {
                        businessChannel = bc;
                        break;
                    }

                    // Also check provider_name in the business channel
                    if (
                        bc.provider_name &&
                        bc.provider_name.toLowerCase() ===
                            provider.provider_name.toLowerCase()
                    ) {
                        businessChannel = bc;
                        break;
                    }
                }

                if (!businessChannel) {
                    logger.warn(
                        `Business channel not found for provider: ${provider.provider_name}`,
                    );
                    continue;
                }

                if (businessChannel.status !== "active") {
                    logger.warn(
                        `Business channel is not active for provider: ${provider.provider_name}`,
                    );
                    continue;
                }

                // Determine which provider service to use based on the configuration
                let providerService = null;
                let providerConfig = null;

                // First try to determine provider from business channel's provider_name
                if (businessChannel.provider_name) {
                    const normalizedProviderName =
                        businessChannel.provider_name.toLowerCase();

                    if (normalizedProviderName === "karix") {
                        providerService = "karix";
                        providerConfig = businessChannel.config;
                    } else if (normalizedProviderName === "meta") {
                        providerService = "meta";
                        providerConfig = businessChannel.config;
                    } else if (normalizedProviderName === "gupshup") {
                        providerService = "gupshup";
                        providerConfig = businessChannel.config;
                    }
                }

                // If provider service not determined yet, check channel configurations
                if (!providerService) {
                    // Check if we have a WhatsApp channel with Karix configuration
                    if (
                        provider.provider_name.toLowerCase() === "whatsapp" &&
                        businessChannel.config &&
                        businessChannel.config.karix
                    ) {
                        providerService = "karix";
                        providerConfig = businessChannel.config.karix;
                    }
                    // Check if we have a WhatsApp channel with Meta configuration
                    else if (
                        provider.provider_name.toLowerCase() === "whatsapp" &&
                        businessChannel.config &&
                        businessChannel.config.meta
                    ) {
                        providerService = "meta";
                        providerConfig = businessChannel.config.meta;
                    }
                    // If no specific provider config is found, try using the config directly
                    else if (businessChannel.config) {
                        // Try to determine the provider from the config
                        if (
                            businessChannel.config.api_key &&
                            (businessChannel.config
                                .whatsapp_business_account_id ||
                                businessChannel.config.sender_id)
                        ) {
                            providerService = "karix";
                            providerConfig = businessChannel.config;
                        } else if (
                            businessChannel.config.access_token &&
                            businessChannel.config.business_account_id
                        ) {
                            providerService = "meta";
                            providerConfig = businessChannel.config;
                        } else if (
                            businessChannel.config.api_key &&
                            businessChannel.config.app_id
                        ) {
                            providerService = "gupshup";
                            providerConfig = businessChannel.config;
                        }
                    }
                }

                if (!providerService || !providerConfig) {
                    logger.warn(
                        `No valid provider configuration found for ${provider.provider_name}`,
                    );
                    continue;
                }

                // Now use the determined provider service and config to check status
                let providerStatus;

                switch (providerService) {
                    case "meta":
                        providerStatus =
                            await metaTemplateService.getTemplateById(
                                providerConfig.access_token,
                                providerConfig.business_account_id,
                                provider.provider_template_id,
                            );
                        break;
                    case "karix":
                        // Use sender_id as fallback for whatsapp_business_account_id
                        const wabaId =
                            providerConfig.whatsapp_business_account_id ||
                            providerConfig.sender_id;
                        providerStatus =
                            await karixTemplateService.getTemplateById(
                                providerConfig.api_key,
                                wabaId,
                                provider.provider_template_id,
                            );
                        break;
                    case "gupshup":
                        providerStatus =
                            await gupshupTemplateService.getGupshupTemplateById(
                                providerConfig.api_key,
                                providerConfig.app_id,
                                provider.provider_template_id,
                            );
                        break;
                    default:
                        logger.warn(
                            `Provider service ${providerService} not supported for status check`,
                        );
                        continue;
                }

                // Map provider status to our system status based on provider type
                let newStatus;
                let rejectionReason = null;

                if (providerService === "karix") {
                    // Handle Karix specific response format
                    const karixStatus =
                        providerStatus.template_create_status || "";
                    switch (karixStatus.toUpperCase()) {
                        case "APPROVED":
                            newStatus = "approved";
                            break;
                        case "REJECTED":
                            newStatus = "rejected";
                            rejectionReason =
                                providerStatus.template_status_reason ||
                                "Rejected by provider";
                            break;
                        case "PENDING":
                        case "IN_REVIEW":
                            newStatus = "pending";
                            break;
                        default:
                            newStatus = "pending"; // Default to pending if unknown
                            break;
                    }
                } else {
                    // Handle other providers (Meta, Gupshup, etc.)
                    const genericStatus = providerStatus.status || "";
                    switch (genericStatus.toUpperCase()) {
                        case "APPROVED":
                            newStatus = "approved";
                            break;
                        case "REJECTED":
                            newStatus = "rejected";
                            rejectionReason =
                                providerStatus.reason || "Rejected by provider";
                            break;
                        case "PENDING":
                        default:
                            newStatus = "pending";
                            break;
                    }
                }

                // Update provider status in database if changed
                if (newStatus !== provider.approval_status) {
                    const updateData = {
                        approval_status: newStatus,
                    };

                    if (newStatus === "approved") {
                        updateData.approved_at = new Date().toISOString();
                    }

                    if (newStatus === "rejected" && rejectionReason) {
                        updateData.rejected_reason = rejectionReason;
                    }

                    await TemplateProvider.query().patchAndFetchById(
                        provider.id,
                        updateData,
                    );

                    // Update template status if needed
                    if (
                        newStatus === "approved" &&
                        template.status !== "approved"
                    ) {
                        await Template.query().patchAndFetchById(template.id, {
                            status: "approved",
                            approved_at: new Date().toISOString(),
                        });
                    } else if (
                        newStatus === "rejected" &&
                        template.status !== "rejected"
                    ) {
                        await Template.query().patchAndFetchById(template.id, {
                            status: "rejected",
                        });
                    }
                }
            } catch (providerError) {
                logger.error(
                    `Error checking status with ${provider.provider_name} for template ${template.id}:`,
                    providerError,
                );
                // Continue with other providers even if one fails
            }
        }
    } catch (error) {
        logger.error(
            `Error in checkAndUpdateTemplateStatus for template ${template.id}:`,
            error,
        );
        throw error;
    }
}
// ===== Main Service Functions =====

/**
 * Create a new template
 * @param {Object} data - Template data
 * @param {string} businessId - Business ID
 * @param {string} userId - User ID
 * @returns {Object} Created template
 */
async function createTemplate(data, businessId, userId) {
    return await transaction(async (trx) => {
        try {
            // Validate business exists
            const business = await Business.query(trx).findById(businessId);
            if (!business) {
                throw boom.notFound("Business not found");
            }

            // Get language ID for primary language
            const primaryLanguage = data.languages[0];
            const languageId = await getLanguageIdFromCode(primaryLanguage);

            // Get business channel
            const businessChannel = await BusinessChannel.query(trx)
                .findById(data.business_channel)
                .withGraphFetched("businessChannel");

            if (!businessChannel) {
                throw boom.notFound(
                    `Business channel with ID ${data.business_channel} not found`,
                );
            }

            if (businessChannel.business_id !== businessId) {
                throw boom.badRequest(
                    `Business channel does not belong to this business`,
                );
            }

            if (businessChannel.status !== "active") {
                throw boom.badRequest(`Business channel is not active`);
            }

            // Check for duplicate template name
            const existingTemplate = await Template.query(trx)
                .where({
                    business_id: businessId,
                    name: data.template_name,
                    language_id: languageId,
                })
                .first();

            if (existingTemplate) {
                throw boom.conflict(
                    "Template with this name already exists for this business and language",
                );
            }

            // Create template record
            const template = await Template.query(trx).insert({
                business_id: businessId,
                name: data.template_name,
                description:
                    data.description || `Template for ${data.template_name}`,
                category: data.category,
                language_id: languageId,
                content: data.content.body.text,
                variables: data.placeholders
                    ? { placeholders: data.placeholders }
                    : null,
                status: "draft",
                business_channel: data.business_channel,
                created_by: userId,
                metadata: {
                    full_content: data.content,
                    languages: data.languages,
                    business_channel: data.business_channel,
                },
            });

            // Create template components
            const components = [];

            // Header component
            if (data.content.header) {
                const headerComponent = await TemplateComponent.query(
                    trx,
                ).insert({
                    template_id: template.id,
                    component_type: "header",
                    content: data.content.header.text || "",
                    sequence: 0,
                    metadata: data.content.header,
                });
                components.push(headerComponent);
            }

            // Body component (required)
            const bodyComponent = await TemplateComponent.query(trx).insert({
                template_id: template.id,
                component_type: "body",
                content: data.content.body.text,
                sequence: 1,
            });
            components.push(bodyComponent);

            // Footer component
            if (data.content.footer) {
                const footerComponent = await TemplateComponent.query(
                    trx,
                ).insert({
                    template_id: template.id,
                    component_type: "footer",
                    content: data.content.footer.text,
                    sequence: 2,
                });
                components.push(footerComponent);
            }

            // Add buttons if present
            if (data.content.buttons && data.content.buttons.length > 0) {
                for (let i = 0; i < data.content.buttons.length; i++) {
                    const button = data.content.buttons[i];
                    await TemplateButton.query(trx).insert({
                        template_component_id: bodyComponent.id,
                        button_type: button.type,
                        text: button.text,
                        payload: button.value || button.id,
                        sequence: i,
                    });
                }
            }
            // Add media if present
            if (
                data.content.header &&
                data.content.header.type !== "text" &&
                data.content.header.media_url
            ) {
                await TemplateMedia.query(trx).insert({
                    template_id: template.id,
                    media_type: data.content.header.type,
                    url: data.content.header.media_url,
                    caption: data.content.header.text || null,
                    filename: data.content.header.filename || null,
                });
            }
            // Get the channel name to use as provider name
            const channelName = businessChannel.businessChannel.name;
            const providerName = businessChannel.provider_name;
            logger.info(
                `Using provider: ${channelName} / ${providerName} for business channel ID: ${data.business_channel}`,
            );

            try {
                // Submit template to provider
                const providerResult = await submitTemplateToProvider(
                    channelName,
                    data,
                    businessChannel,
                );

                // Create provider record
                await TemplateProvider.query(trx).insert({
                    template_id: template.id,
                    channel_id: businessChannel.channel_id,
                    provider_name: providerName,
                    provider_template_name: data.template_name,
                    provider_template_id:
                        providerResult?.templateId ||
                        providerResult?.data?.id ||
                        "",
                    approval_status: "pending",
                });

                // Update template status to pending_approval
                await Template.query(trx).patchAndFetchById(template.id, {
                    status: "pending_approval",
                    external_template_id:
                        providerResult?.templateId ||
                        providerResult?.data?.id ||
                        null,
                });

                // Update template with the provider info
                template.status = "pending_approval";
                template.external_template_id =
                    providerResult?.templateId ||
                    providerResult?.data?.id ||
                    null;
            } catch (providerError) {
                // Log the error and rethrow it to be handled in the API response
                logger.error(
                    `Error submitting template to provider:`,
                    providerError,
                );
                throw providerError;
            }

            // Return the created template with its components
            const result = await Template.query(trx)
                .findById(template.id)
                .withGraphFetched(
                    "[components.[buttons], media, providers, language]",
                );

            // Format the response
            return {
                template_id: result.id,
                template_name: result.name,
                business_id: result.business_id,
                category: result.category,
                languages: data.languages,
                content: data.content,
                placeholders: data.placeholders || [],
                status: result.status,
                created_at: result.created_at,
                provider_submissions: result.providers
                    ? result.providers.map((p) => ({
                          provider: p.provider_name,
                          status: p.approval_status,
                          submission_id: p.provider_template_id,
                      }))
                    : [],
                business_channel: data.business_channel,
            };
        } catch (error) {
            logger.error("Error creating template:", error);
            if (error.isBoom) {
                throw error;
            }
            if (error.code === "42P01") {
                throw boom.badImplementation(
                    "Database table does not exist. Please run migrations.",
                );
            }
            if (error.code === "23505") {
                throw boom.conflict("Template with this name already exists");
            }
            throw boom.badImplementation("Failed to create template");
        }
    });
}

async function getTemplates(filters, pagination, refreshStatus = false) {
    try {
        logger.debug("Getting templates with filters:", {
            filters,
            pagination,
            refreshStatus,
        });

        // Start building the query
        let query = Template.query()
            .select(
                "template.*",
                "language.code as language_code",
                "language.name as language_name",
                "bc.name as business_channel_name",
                "channel.name as channel_name",
            )
            .join("language", "template.language_id", "language.id")
            .leftJoin(
                "business_channel as bc",
                "template.business_channel",
                "bc.id",
            )
            .leftJoin("channel", "bc.channel_id", "channel.id");

        // Apply filters
        if (filters.business_id) {
            query = query.where("template.business_id", filters.business_id);
            logger.debug(`Filtering by business_id: ${filters.business_id}`);
        }

        if (filters.category) {
            query = query.where("template.category", filters.category);
        }

        if (filters.status) {
            query = query.where("template.status", filters.status);
        }

        if (filters.language) {
            query = query.where("language.code", filters.language);
        }

        if (filters.channel) {
            query = query.where("channel.name", filters.channel);
        }

        if (filters.business_channel) {
            query = query.whereExists(
                TemplateProvider.query()
                    .whereColumn("template_provider.template_id", "template.id")
                    .where(
                        "template_provider.provider_name",
                        filters.business_channel,
                    ),
            );
        }

        // Handle search by template name if provided
        if (filters.name) {
            query = query.whereILike("template.name", `%${filters.name}%`);
        }

        // First get the count of the total records for pagination
        const totalResults = await query.clone().resultSize();
        logger.debug(`Total results before pagination: ${totalResults}`);

        // Apply pagination and sorting
        const {
            page = 1,
            per_page = 10,
            sort_by = "created_at",
            sort_order = "desc",
        } = pagination;

        // Ensure the sort_by field is prefixed with the table name if needed
        let sortField = sort_by;
        if (!sortField.includes(".")) {
            sortField = `template.${sortField}`;
        }

        const offset = (page - 1) * per_page;

        logger.debug(
            `Applying pagination: page=${page}, per_page=${per_page}, offset=${offset}`,
        );
        logger.debug(`Sorting by ${sortField} ${sort_order}`);

        query = query
            .orderBy(sortField, sort_order)
            .limit(per_page)
            .offset(offset);

        // Log the final SQL query for debugging
        const sql = query.toKnexQuery().toString();
        logger.debug(`Final SQL query: ${sql}`);

        // Execute query
        const templates = await query.withGraphFetched("[providers]");
        logger.debug(
            `Retrieved ${templates.length} templates after pagination`,
        );

        // If refresh_status is true, check and update status for templates in pending_approval status
        if (refreshStatus) {
            const pendingTemplates = templates.filter(
                (t) =>
                    t.status === "pending_approval" &&
                    t.providers &&
                    t.providers.length > 0,
            );

            logger.debug(
                `Found ${pendingTemplates.length} pending templates to refresh`,
            );

            // Process status updates in parallel with a concurrency limit
            if (pendingTemplates.length > 0) {
                // Process templates in batches
                const batchSize = 5;
                for (let i = 0; i < pendingTemplates.length; i += batchSize) {
                    const batch = pendingTemplates.slice(i, i + batchSize);
                    await Promise.all(
                        batch.map(async (template) => {
                            try {
                                await checkAndUpdateTemplateStatus(template);
                            } catch (error) {
                                logger.error(
                                    `Error checking status for template ${template.id}:`,
                                    error,
                                );
                                // Continue processing other templates
                            }
                        }),
                    );
                }
                // Reload templates after status updates if any were updated
                if (pendingTemplates.length > 0) {
                    const refreshedTemplates = await query.withGraphFetched(
                        "[providers]",
                    );
                    templates.length = 0; // Clear the array
                    templates.push(...refreshedTemplates); // Add the refreshed templates
                }
            }
        }

        // Prepare pagination metadata
        const totalPages = Math.ceil(totalResults / per_page);

        return {
            data: templates.map((template) => ({
                template_id: template.id,
                template_name: template.name,
                category: template.category,
                description: template.description,
                status: template.status,
                language: {
                    code: template.language_code,
                    name: template.language_name,
                },
                channel: template.channel_name,
                created_at: template.created_at,
                updated_at: template.updated_at,
                version: template.version,
                provider_submissions: template.providers
                    ? template.providers.map((p) => ({
                          provider: p.provider_name,
                          status: p.approval_status,
                          submission_id: p.provider_template_id,
                      }))
                    : [],
            })),
            pagination: {
                total_items: totalResults,
                total_pages: totalPages,
                current_page: parseInt(page),
                per_page: parseInt(per_page),
            },
        };
    } catch (error) {
        logger.error("Error fetching templates:", error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to fetch templates");
    }
}

/**
 * Get template by ID with all components
 * @param {string} templateId - Template ID
 * @returns {Object} Template details
 */
async function getTemplateById(templateId) {
    try {
        // Fetch template with its related data
        const template = await Template.query()
            .findById(templateId)
            .withGraphFetched(
                "[components.[buttons], media, providers, language, channel, creator]",
            );

        if (!template) {
            throw boom.notFound("Template not found");
        }

        // Restructure the response to match API docs
        const response = {
            template_id: template.id,
            template_name: template.name,
            business_id: template.business_id,
            description: template.description,
            category: template.category,
            status: template.status,
            version: template.version,
            language: {
                code: template.language.code,
                name: template.language.name,
            },
            channel: template.channel.name,
            created_at: template.created_at,
            updated_at: template.updated_at,
            created_by: template.created_by,
            content: {},
        };

        // Rebuild the content structure from components
        for (const component of template.components) {
            const componentType = component.component_type;

            if (componentType === "header") {
                response.content.header = {
                    type: component.metadata?.type || "text",
                    text: component.content,
                };

                // Add media info if available
                if (template.media && template.media.length > 0) {
                    const headerMedia = template.media.find(
                        (m) =>
                            component.metadata?.type === m.media_type &&
                            !m.component_id,
                    );
                    if (headerMedia) {
                        response.content.header.media_url = headerMedia.url;
                        response.content.header.filename = headerMedia.filename;
                    }
                }
            } else if (componentType === "body") {
                response.content.body = {
                    text: component.content,
                };

                // Add buttons if available
                if (component.buttons && component.buttons.length > 0) {
                    response.content.buttons = component.buttons
                        .map((button) => ({
                            type: button.button_type,
                            text: button.text,
                            value: button.payload,
                            id: button.payload,
                        }))
                        .sort((a, b) => a.sequence - b.sequence);
                }
            } else if (componentType === "footer") {
                response.content.footer = {
                    text: component.content,
                };
            } else if (componentType === "carousel") {
                // Handle carousel component
                try {
                    // Start with basic carousel structure
                    let carousel = {
                        cards: [],
                    };

                    // Try to parse stored JSON content if available
                    if (component.content) {
                        try {
                            const parsedContent = JSON.parse(component.content);
                            carousel = parsedContent;
                        } catch (parseError) {
                            logger.warn(
                                `Error parsing carousel JSON: ${parseError.message}`,
                            );
                        }
                    }

                    // Find all carousel card components
                    const carouselCards = template.components
                        .filter(
                            (c) =>
                                c.component_type === "carousel_card" &&
                                c.parent_component_id === component.id,
                        )
                        .sort((a, b) => a.sequence - b.sequence);

                    // If we found card components, use them to build detailed cards
                    if (carouselCards.length > 0) {
                        carousel.cards = carouselCards.map((card) => {
                            const cardData = {
                                body: {
                                    text: card.content,
                                },
                            };

                            // Find media for this card
                            if (template.media && template.media.length > 0) {
                                const cardMedia = template.media.find(
                                    (m) => m.component_id === card.id,
                                );

                                if (cardMedia) {
                                    cardData.header = {
                                        type: cardMedia.media_type,
                                        media_url: cardMedia.url,
                                        filename: cardMedia.filename || null,
                                        text: cardMedia.caption || null,
                                    };
                                }
                            }

                            // Find buttons for this card
                            const cardButtons = card.buttons;
                            if (cardButtons && cardButtons.length > 0) {
                                cardData.buttons = cardButtons
                                    .map((button) => ({
                                        type: button.button_type,
                                        text: button.text,
                                        value: button.payload,
                                        id: button.payload,
                                    }))
                                    .sort((a, b) => a.sequence - b.sequence);
                            }

                            return cardData;
                        });
                    }

                    // Add the carousel to the response
                    response.content.carousel = carousel;
                } catch (carouselError) {
                    logger.error(
                        `Error rebuilding carousel data: ${carouselError.message}`,
                    );
                }
            }
        }

        // If we have template metadata but couldn't rebuild carousel content from components
        if (
            template.metadata?.full_content?.carousel &&
            (!response.content.carousel ||
                !response.content.carousel.cards?.length)
        ) {
            response.content.carousel = template.metadata.full_content.carousel;
        }

        // Add placeholder variables if available
        if (template.variables && template.variables.placeholders) {
            response.placeholders = template.variables.placeholders;
        }

        // Add provider information
        response.provider_submissions = template.providers.map((p) => ({
            provider: p.provider_name,
            status: p.approval_status,
            submission_id: p.provider_template_id,
            provider_template_name: p.provider_template_name,
            approved_at: p.approved_at,
            rejected_reason: p.rejected_reason,
        }));

        return response;
    } catch (error) {
        logger.error(`Error getting template by ID ${templateId}:`, error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to fetch template");
    }
}

const checkTemplateStatus = async (businessId, templateId) => {
    try {
        logger.debug(`Checking template status for ID: ${templateId}`);

        // Get the template without using a transaction
        const existingTemplate = await Template.query()
            .where({
                business_id: businessId,
                id: templateId,
            })
            .withGraphFetched("[providers]")
            .first();

        if (!existingTemplate) {
            throw boom.notFound("Template not found for this business and id");
        }

        // Call the helper function to check and update status
        await checkAndUpdateTemplateStatus(existingTemplate);

        // Fetch the updated template with fresh data
        const updatedTemplate = await Template.query()
            .findById(templateId)
            .withGraphFetched("[providers]");

        return {
            success: true,
            data: {
                template_id: updatedTemplate.id,
                status: updatedTemplate.status,
                provider_submissions: updatedTemplate.providers
                    ? updatedTemplate.providers.map((p) => ({
                          provider: p.provider_name,
                          status: p.approval_status,
                          submission_id: p.provider_template_id,
                          approved_at: p.approved_at,
                          rejected_reason: p.rejected_reason,
                      }))
                    : [],
            },
        };
    } catch (error) {
        logger.error(`Error checking template status: ${error.message}`, error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation(
            `Failed to check template status: ${error.message}`,
        );
    }
};

/**
 * Update an existing template
 * @param {string} templateId - Template ID
 * @param {Object} data - Updated template data
 * @param {string} userId - User ID making the update
 * @returns {Object} Updated template
 */
async function updateTemplate(templateId, data, userId) {
    return await transaction(async (trx) => {
        try {
            // Get the existing template
            const template = await Template.query(trx)
                .findById(templateId)
                .withGraphFetched("[components.[buttons], media, providers]");

            if (!template) {
                throw boom.notFound("Template not found");
            }

            // Check if template can be modified
            if (template.status === "approved") {
                throw boom.forbidden(
                    "Cannot modify template content after approval. Create a new version instead.",
                );
            }

            // Update the basic template data
            const updates = {};
            if (data.template_name) updates.name = data.template_name;
            if (data.description) updates.description = data.description;
            if (data.category) updates.category = data.category;

            // Update content if provided
            if (data.content) {
                // Update body text
                if (data.content.body && data.content.body.text) {
                    updates.content = data.content.body.text;
                }

                // Update metadata
                if (Object.keys(data.content).length > 0) {
                    updates.metadata = {
                        ...template.metadata,
                        full_content: {
                            ...template.metadata.full_content,
                            ...data.content,
                        },
                    };
                }

                // Update last_edit_at
                updates.last_edit_at = new Date().toISOString();
            }

            // Update placeholders if provided
            if (data.placeholders) {
                updates.variables = {
                    placeholders: data.placeholders,
                };
            }

            // Update template record
            const updatedTemplate = await Template.query(trx).patchAndFetchById(
                templateId,
                updates,
            );

            // Update components if content is provided
            if (data.content) {
                // Update header
                if (data.content.header) {
                    let headerComponent = template.components.find(
                        (c) => c.component_type === "header",
                    );

                    if (headerComponent) {
                        await TemplateComponent.query(trx).patchAndFetchById(
                            headerComponent.id,
                            {
                                content: data.content.header.text || "",
                                metadata: data.content.header,
                            },
                        );
                    } else {
                        headerComponent = await TemplateComponent.query(
                            trx,
                        ).insert({
                            template_id: template.id,
                            component_type: "header",
                            content: data.content.header.text || "",
                            sequence: 0,
                            metadata: data.content.header,
                        });
                    }

                    // Update media if needed
                    if (
                        data.content.header.type !== "text" &&
                        data.content.header.media_url
                    ) {
                        let headerMedia = template.media.find(
                            (m) => m.media_type === data.content.header.type,
                        );

                        if (headerMedia) {
                            await TemplateMedia.query(trx).patchAndFetchById(
                                headerMedia.id,
                                {
                                    url: data.content.header.media_url,
                                    caption: data.content.header.text || null,
                                    filename:
                                        data.content.header.filename || null,
                                },
                            );
                        } else {
                            await TemplateMedia.query(trx).insert({
                                template_id: template.id,
                                media_type: data.content.header.type,
                                url: data.content.header.media_url,
                                caption: data.content.header.text || null,
                                filename: data.content.header.filename || null,
                            });
                        }
                    }
                }

                // Update body
                if (data.content.body) {
                    const bodyComponent = template.components.find(
                        (c) => c.component_type === "body",
                    );
                    if (bodyComponent) {
                        await TemplateComponent.query(trx).patchAndFetchById(
                            bodyComponent.id,
                            {
                                content:
                                    data.content.body.text ||
                                    bodyComponent.content,
                            },
                        );

                        // Update buttons
                        if (data.content.buttons) {
                            // Delete existing buttons
                            if (
                                bodyComponent.buttons &&
                                bodyComponent.buttons.length > 0
                            ) {
                                for (const button of bodyComponent.buttons) {
                                    await TemplateButton.query(trx).deleteById(
                                        button.id,
                                    );
                                }
                            }

                            // Add new buttons
                            for (
                                let i = 0;
                                i < data.content.buttons.length;
                                i++
                            ) {
                                const button = data.content.buttons[i];
                                await TemplateButton.query(trx).insert({
                                    template_component_id: bodyComponent.id,
                                    button_type: button.type,
                                    text: button.text,
                                    payload: button.value || button.id,
                                    sequence: i,
                                });
                            }
                        }
                    }
                }

                // Update footer
                if (data.content.footer) {
                    let footerComponent = template.components.find(
                        (c) => c.component_type === "footer",
                    );

                    if (footerComponent) {
                        await TemplateComponent.query(trx).patchAndFetchById(
                            footerComponent.id,
                            {
                                content: data.content.footer.text,
                            },
                        );
                    } else {
                        footerComponent = await TemplateComponent.query(
                            trx,
                        ).insert({
                            template_id: template.id,
                            component_type: "footer",
                            content: data.content.footer.text,
                            sequence: 2,
                        });
                    }
                }
            }

            // Resubmit to provider if needed
            if (
                template.status === "rejected" &&
                template.providers &&
                template.providers.length > 0
            ) {
                // Get the updated template with all components
                const templateToSubmit = await Template.query(trx)
                    .findById(templateId)
                    .withGraphFetched(
                        "[components.[buttons], media, providers]",
                    );

                // Format for provider submission
                const submissionData = {
                    template_name: templateToSubmit.name,
                    category: templateToSubmit.category,
                    languages: templateToSubmit.metadata.languages,
                    business_channel:
                        templateToSubmit.metadata.business_channel,
                    content: templateToSubmit.metadata.full_content,
                    placeholders:
                        templateToSubmit.variables?.placeholders || [],
                };

                try {
                    // Get the business channel
                    const businessChannel = await BusinessChannel.query(trx)
                        .findById(submissionData.business_channel)
                        .withGraphFetched("channel");

                    if (!businessChannel) {
                        throw boom.notFound(
                            "Business channel not found for resubmission",
                        );
                    }

                    const providerName = businessChannel.channel.name;
                    const provider = templateToSubmit.providers[0];

                    // Delete the existing template at the provider if needed
                    try {
                        if (providerName.toLowerCase() === "meta") {
                            await metaTemplateService.deleteTemplate(
                                businessChannel.config.access_token,
                                businessChannel.config.business_account_id,
                                provider.provider_template_id,
                            );
                        } else if (providerName.toLowerCase() === "karix") {
                            await karixTemplateService.deleteTemplate(
                                businessChannel.config.api_key,
                                businessChannel.config
                                    .whatsapp_business_account_id,
                                provider.provider_template_id,
                            );
                        }
                    } catch (deleteError) {
                        logger.error(
                            `Error deleting template from provider: ${deleteError.message}`,
                        );
                        // Continue with resubmission even if delete fails
                    }

                    // Submit the updated template
                    const providerResult = await submitTemplateToProvider(
                        providerName,
                        submissionData,
                        businessChannel,
                    );

                    // Update provider record
                    await TemplateProvider.query(trx).patchAndFetchById(
                        provider.id,
                        {
                            provider_template_name: templateToSubmit.name,
                            provider_template_id:
                                providerResult?.templateId ||
                                providerResult?.data?.id ||
                                provider.provider_template_id,
                            approval_status: "pending",
                            approved_at: null,
                            rejected_reason: null,
                        },
                    );

                    // Update template status
                    await Template.query(trx).patchAndFetchById(templateId, {
                        status: "pending_approval",
                        external_template_id:
                            providerResult?.templateId ||
                            providerResult?.data?.id ||
                            templateToSubmit.external_template_id ||
                            "",
                    });
                } catch (providerError) {
                    logger.error(
                        `Error resubmitting template to provider:`,
                        providerError,
                    );
                    // Continue without failing the entire update
                }
            }

            // Return the updated template
            const result = await Template.query(trx)
                .findById(templateId)
                .withGraphFetched(
                    "[components.[buttons], media, providers, language, channel]",
                );

            // Format response
            return {
                template_id: result.id,
                template_name: result.name,
                business_id: result.business_id,
                description: result.description,
                category: result.category,
                status: result.status,
                language: {
                    code: result.language.code,
                    name: result.language.name,
                },
                channel: result.channel.name,
                content: result.metadata.full_content,
                placeholders: result.variables?.placeholders || [],
                created_at: result.created_at,
                updated_at: result.updated_at,
                provider_submissions: result.providers
                    ? result.providers.map((p) => ({
                          provider: p.provider_name,
                          status: p.approval_status,
                          submission_id: p.provider_template_id,
                      }))
                    : [],
            };
        } catch (error) {
            logger.error(`Error updating template ${templateId}:`, error);
            if (error.isBoom) {
                throw error;
            }
            throw boom.badImplementation("Failed to update template");
        }
    });
}

/**
 * Delete a template
 * @param {string} templateId - Template ID
 * @param {string} businessId - Business ID
 * @returns {Object} Deletion confirmation
 */
async function deleteTemplate(templateId, businessId) {
    return await transaction(async (trx) => {
        try {
            // Get the template
            const template = await Template.query(trx)
                .findById(templateId)
                .withGraphFetched("[providers]");

            if (!template) {
                throw boom.notFound("Template not found");
            }

            // Check that template belongs to the business
            if (template.business_id !== businessId) {
                throw boom.forbidden(
                    "You don0t have permission to delete this template",
                );
            }

            // Check if template can be deleted
            if (template.status === "approved") {
                throw boom.forbidden(
                    "Cannot delete an approved template. Deactivate it instead.",
                );
            }

            // Try to delete from providers if template was submitted
            if (template.providers && template.providers.length > 0) {
                for (const provider of template.providers) {
                    try {
                        const businessChannel = await BusinessChannel.query(trx)
                            .where({
                                business_id: businessId,
                                channel_id: provider.channel_id,
                            })
                            .first();

                        if (!businessChannel) {
                            logger.warn(
                                "Business channel not found for deletion",
                            );
                            continue;
                        }

                        const providerName =
                            provider.provider_name.toLowerCase();

                        if (providerName === "meta") {
                            await metaTemplateService.deleteTemplate(
                                businessChannel.config.access_token,
                                businessChannel.config.business_account_id,
                                provider.provider_template_id,
                            );
                        } else if (providerName === "karix") {
                            await karixTemplateService.deleteTemplate(
                                businessChannel.config.api_key,
                                businessChannel.config
                                    .whatsapp_business_account_id,
                                provider.provider_template_id,
                            );
                        } else if (providerName === "gupshup") {
                            // Gupshup delete template - if supported
                            logger.info(
                                "Gupshup template deletion not implemented",
                            );
                        }
                    } catch (providerError) {
                        logger.error;
                    }
                }

                // Delete all related data and the template itself
                // Delete template providers
                if (template.providers && template.providers.length > 0) {
                    await TemplateProvider.query(trx)
                        .delete()
                        .where("template_id", templateId);
                }

                // Delete template media
                await TemplateMedia.query(trx)
                    .delete()
                    .where("template_id", templateId);

                // Delete template buttons and components
                const components = await TemplateComponent.query(trx).where(
                    "template_id",
                    templateId,
                );

                for (const component of components) {
                    // Delete buttons for this component
                    await TemplateButton.query(trx)
                        .delete()
                        .where("template_component_id", component.id);
                }

                // Delete components
                await TemplateComponent.query(trx)
                    .delete()
                    .where("template_id", templateId);

                // Finally delete the template
                await Template.query(trx).deleteById(templateId);

                return {
                    message: "Template successfully deleted",
                    template_id: templateId,
                };
            }
        } catch (error) {
            logger.error(`Error deleting template ${templateId}:`, error);
            if (error.isBoom) {
                throw error;
            }
            throw boom.badImplementation("Failed to delete template");
        }
    });
}

module.exports = {
    createTemplate,
    getTemplates,
    getTemplateById,
    checkTemplateStatus,
    updateTemplate,
    deleteTemplate,
};
