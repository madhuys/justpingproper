// api/Channel/service.js
const boom = require("@hapi/boom");
const logger = require("../../system/utils/logger");
const { transaction } = require("../../system/db/database");
const Channel = require("../../system/models/Channel");
const BusinessChannel = require("../../system/models/BusinessChannel");
const Business = require("../../system/models/Business");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

/**
 * Get all channels with pagination and filtering
 * @param {Object} filters - Query filters
 * @param {Object} pagination - Pagination parameters
 * @returns {Promise<Object>} - Channels and pagination info
 */
async function getAllChannels(filters = {}, pagination = {}) {
    try {
        const { page, per_page, sort_by, sort_order } = pagination;

        // Build base query
        const baseQuery = Channel.query().modify("notDeleted");

        // Apply filters
        Object.keys(filters).forEach((key) => {
            baseQuery.where(`channel.${key}`, filters[key]);
        });

        // Get total count without ordering
        const countQuery = baseQuery.clone().count("id as count").first();

        // Apply ordering to the main query, not the count query
        const dataQuery = baseQuery
            .clone()
            .orderBy(sort_by, sort_order)
            .limit(per_page)
            .offset((page - 1) * per_page);

        // Execute both queries
        const [total, channels] = await Promise.all([countQuery, dataQuery]);

        return {
            data: channels,
            pagination: {
                total: parseInt(total.count),
                per_page,
                current_page: page,
                total_pages: Math.ceil(total.count / per_page),
            },
        };
    } catch (error) {
        logger.error("Error getting channels:", error);
        throw boom.badImplementation("Failed to fetch channels");
    }
}

/**
 * Get channel by ID
 * @param {string} id - Channel ID
 * @returns {Promise<Object>} - Channel data
 */
async function getChannelById(id) {
    try {
        const channel = await Channel.query().modify("notDeleted").findById(id);
        if (!channel) {
            // This is an expected error case, not a system failure
            logger.info(`Channel not found with ID: ${id}`);
            throw boom.notFound("Channel not found");
        }
        return channel;
    } catch (error) {
        // Only log unexpected errors as errors
        if (!error.isBoom) {
            logger.error(`Error getting channel by ID ${id}:`, error);
            throw boom.badImplementation("Failed to fetch channel");
        }
        // Re-throw boom errors directly without additional logging
        throw error;
    }
}

/**
 * Create a new channel
 * @param {Object} data - Channel data
 * @param {string} userId - Creator user ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Created channel
 */
async function createChannel(data, userId, businessId) {
    try {
        // Check if a channel with this name already exists
        const existingChannel = await Channel.query()
            .modify("notDeleted")
            .where({ name: data.name, business_id: businessId })
            .first();

        if (existingChannel) {
            throw boom.conflict("Channel with this name already exists");
        }

        // Assign UUIDs to each provider in the providers_config_schema
        const providersWithIds = data.providers_config_schema.map(
            (provider) => ({
                id: uuidv4(),
                name: provider.name,
                required: provider.required || [],
                properties: provider.properties || {},
            }),
        );

        // Proceed with creating the channel
        return await transaction(async (trx) => {
            const channel = await Channel.query(trx).insert({
                name: data.name,
                description: data.description || null,
                providers_config_schema: providersWithIds,
                created_by: userId,
                business_id: businessId,
            });

            logger.info("Channel created successfully", {
                channelId: channel.id,
            });

            return channel;
        });
    } catch (error) {
        logger.error("Error creating channel:", error);
        if (error.isBoom) {
            throw error;
        }
        if (error.code === "23505") {
            // Unique constraint violation
            throw boom.conflict("Channel with this name already exists");
        }
        throw boom.badImplementation("Failed to create channel");
    }
}

/**
 * Update an existing channel
 * @param {string} id - Channel ID
 * @param {Object} data - Updated channel data
 * @returns {Promise<Object>} - Updated channel
 */
async function updateChannel(id, data) {
    try {
        // Validate inputs
        if (!id) {
            throw boom.badRequest("Channel ID is required");
        }

        if (!data || Object.keys(data).length === 0) {
            throw boom.badRequest("No update data provided");
        }

        // Check if channel exists
        const channel = await Channel.query().modify("notDeleted").findById(id);
        if (!channel) {
            throw boom.notFound(`Channel with ID ${id} not found`);
        }

        // Check if name is being changed and if it conflicts with existing channels
        if (data.name && data.name !== channel.name) {
            const existingChannel = await Channel.query()
                .modify("notDeleted")
                .where("name", data.name)
                .whereNot("id", id)
                .first();

            if (existingChannel) {
                throw boom.conflict(
                    `Channel with name '${data.name}' already exists`,
                );
            }
        }

        let updatedProvidersConfig = channel.providers_config_schema;

        // Handle updating providers_config_schema if provided
        if (data.providers_config_schema) {
            // Map of existing provider IDs to preserve them when possible
            const existingProviderMap = {};
            if (channel.providers_config_schema) {
                channel.providers_config_schema.forEach((provider) => {
                    existingProviderMap[provider.name] = provider.id;
                });
            }

            // Process each provider in the update data
            updatedProvidersConfig = data.providers_config_schema.map(
                (provider) => {
                    // If this provider already has an ID in the update data, use it
                    if (provider.id) {
                        return {
                            id: provider.id,
                            name: provider.name,
                            required: provider.required || [],
                            properties: provider.properties || {},
                        };
                    }

                    // If a provider with this name already exists, reuse its ID
                    if (existingProviderMap[provider.name]) {
                        return {
                            id: existingProviderMap[provider.name],
                            name: provider.name,
                            required: provider.required || [],
                            properties: provider.properties || {},
                        };
                    }

                    // Otherwise, generate a new UUID
                    return {
                        id: uuidv4(),
                        name: provider.name,
                        required: provider.required || [],
                        properties: provider.properties || {},
                    };
                },
            );
        }

        return await transaction(async (trx) => {
            try {
                const updatedChannel = await Channel.query(
                    trx,
                ).patchAndFetchById(id, {
                    name: data.name || channel.name,
                    description:
                        data.description !== undefined
                            ? data.description
                            : channel.description,
                    providers_config_schema: updatedProvidersConfig,
                    updated_at: new Date().toISOString(),
                });

                logger.info("Channel updated successfully", {
                    channelId: updatedChannel.id,
                });

                return updatedChannel;
            } catch (trxError) {
                logger.error(
                    `Transaction error updating channel ${id}:`,
                    trxError,
                );
                throw trxError; // Re-throw to be caught by outer try-catch
            }
        });
    } catch (error) {
        logger.error(`Error updating channel ${id}:`, error);

        // Keep specific boom errors or create new ones based on error type
        if (error.isBoom) {
            throw error;
        }
        if (error.code === "23505") {
            // Unique constraint violation
            throw boom.conflict("Channel with this name already exists");
        }
        throw boom.badImplementation(
            `Failed to update channel: ${error.message}`,
        );
    }
}

/**
 * Delete a channel (soft delete)
 * @param {string} id - Channel ID
 * @returns {Promise<Object>} - Success status
 */
async function deleteChannel(id) {
    try {
        // Check if channel exists
        const channel = await Channel.query().modify("notDeleted").findById(id);
        if (!channel) {
            throw boom.notFound("Channel not found");
        }

        // Check if channel is being used by any business
        const businessChannels = await BusinessChannel.query()
            .modify("notDeleted")
            .where("channel_id", id);

        if (businessChannels.length > 0) {
            throw boom.conflict(
                "Cannot delete channel that is in use by businesses",
            );
        }

        return await transaction(async (trx) => {
            // Soft delete the channel by setting is_deleted to true
            await Channel.query(trx).patchAndFetchById(id, {
                is_deleted: true,
                updated_at: new Date().toISOString(),
            });

            logger.info("Channel deleted successfully", {
                channelId: id,
            });

            return { success: true };
        });
    } catch (error) {
        logger.error(`Error deleting channel ${id}:`, error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to delete channel");
    }
}

// Business Channel Operations

/**
 * Get all business channels with pagination and filtering
 * @param {Object} filters - Query filters
 * @param {Object} pagination - Pagination parameters
 * @returns {Promise<Object>} - Business channels and pagination info
 */
async function getBusinessChannels(filters = {}, pagination = {}) {
    try {
        const { page, per_page, sort_by, sort_order } = pagination;

        // Build base query
        const baseQuery = BusinessChannel.query()
            .select("business_channel.*", "channel.name as channel_name")
            .innerJoin("channel", "business_channel.channel_id", "channel.id")
            .where("business_channel.is_deleted", false);

        // Apply filters
        Object.keys(filters).forEach((key) => {
            if (key.includes(".")) {
                // Handle dot notation for joined tables
                baseQuery.where(key, filters[key]);
            } else {
                // Default to business_channel table
                baseQuery.where(`business_channel.${key}`, filters[key]);
            }
        });

        // Create a separate count query
        const countQuery = baseQuery
            .clone()
            .clearSelect()
            .count("business_channel.id as count")
            .first();

        // Apply ordering and pagination to the main query
        const dataQuery = baseQuery
            .clone()
            .orderBy(`business_channel.${sort_by}`, sort_order)
            .limit(per_page)
            .offset((page - 1) * per_page);

        // Execute both queries in parallel
        const [total, businessChannels] = await Promise.all([
            countQuery,
            dataQuery,
        ]);

        return {
            data: businessChannels,
            pagination: {
                total: parseInt(total.count),
                per_page,
                current_page: page,
                total_pages: Math.ceil(total.count / per_page),
            },
        };
    } catch (error) {
        logger.error("Error getting business channels:", error);
        throw boom.badImplementation("Failed to fetch business channels");
    }
}

/**
 * Get a business channel by ID
 * @param {string} id - Business channel ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Business channel data
 */
async function getBusinessChannelById(id, businessId) {
    try {
        const businessChannel = await BusinessChannel.query()
            .modify("notDeleted")
            .select("business_channel.*", "channel.name as channel_name")
            .join("channel", "business_channel.channel_id", "channel.id")
            .where("business_channel.id", id)
            .andWhere("business_channel.business_id", businessId)
            .first();

        if (!businessChannel) {
            throw boom.notFound("Business channel not found");
        }

        return businessChannel;
    } catch (error) {
        if (error.isBoom) {
            throw error;
        }
        logger.error(`Error getting business channel by ID ${id}:`, error);
        throw boom.badImplementation("Failed to fetch business channel");
    }
}

/**
 * Create a new business channel
 * @param {string} businessId - Business ID
 * @param {string} userId - Creator user ID
 * @param {Object} data - Business channel data
 * @returns {Promise<Object>} - Created business channel
 */
async function createBusinessChannel(businessId, userId, data) {
    return await transaction(async (trx) => {
        try {
            // Check if business exists
            const business = await Business.query(trx).findById(businessId);
            if (!business) {
                throw boom.notFound("Business not found");
            }

            // Check if channel exists
            const channel = await Channel.query(trx)
                .modify("notDeleted")
                .findById(data.channel_id);

            if (!channel) {
                throw boom.notFound("Channel not found");
            }

            // Validate the provider_id against the channel's providers_config_schema
            if (
                !channel.providers_config_schema ||
                !Array.isArray(channel.providers_config_schema)
            ) {
                throw boom.badData(
                    "Channel does not have valid provider configurations",
                );
            }

            const providerExists = channel.providers_config_schema.some(
                (provider) => provider.id === data.provider_id,
            );

            if (!providerExists) {
                throw boom.badRequest(
                    `Provider ID ${data.provider_id} not found in channel configuration schema`,
                );
            }

            // Get the provider details
            const providerConfig = channel.providers_config_schema.find(
                (provider) => provider.id === data.provider_id,
            );

            // Check if the provided config matches the required fields from provider
            if (providerConfig.required && providerConfig.required.length > 0) {
                const missingFields = providerConfig.required.filter(
                    (field) => !data.config || data.config[field] === undefined,
                );

                if (missingFields.length > 0) {
                    throw boom.badRequest(
                        `Missing required configuration fields: ${missingFields.join(
                            ", ",
                        )}`,
                    );
                }
            }

            // Check if a channel configuration with this name already exists for this business
            const existingConfig = await BusinessChannel.query(trx)
                .modify("notDeleted")
                .where({
                    business_id: businessId,
                    name: data.name,
                })
                .first();

            if (existingConfig) {
                throw boom.conflict(
                    "A channel configuration with this name already exists for this business",
                );
            }

            // Create the business channel
            const businessChannel = await BusinessChannel.query(trx).insert({
                business_id: businessId,
                channel_id: data.channel_id,
                name: data.name,
                description: data.description || null,
                provider_id: data.provider_id,
                provider_name: providerConfig.name,
                status: "active",
                config: data.config,
                created_by: userId,
            });

            logger.info("Business channel created successfully", {
                businessChannelId: businessChannel.id,
                businessId: businessId,
                channelId: data.channel_id,
                providerId: data.provider_id,
            });

            return {
                ...businessChannel,
                channel_name: channel.name,
            };
        } catch (error) {
            if (error.isBoom) {
                throw error;
            }
            logger.error(
                `Error creating business channel for business ${businessId}:`,
                error,
            );
            if (error.code === "23505") {
                throw boom.conflict(
                    "Channel configuration with this name already exists",
                );
            }
            throw boom.badImplementation("Failed to create business channel");
        }
    });
}

/**
 * Update a business channel
 * @param {string} id - Business channel ID
 * @param {string} businessId - Business ID
 * @param {Object} data - Updated business channel data
 * @returns {Promise<Object>} - Updated business channel
 */
async function updateBusinessChannel(id, businessId, data) {
    return await transaction(async (trx) => {
        try {
            // Check if business channel exists and belongs to the business
            const businessChannel = await BusinessChannel.query(trx)
                .modify("notDeleted")
                .where({
                    id: id,
                    business_id: businessId,
                })
                .first();

            if (!businessChannel) {
                throw boom.notFound("Business channel not found");
            }

            // If name is being changed, check for duplicates
            if (data.name && data.name !== businessChannel.name) {
                const existingName = await BusinessChannel.query(trx)
                    .modify("notDeleted")
                    .where({
                        business_id: businessId,
                        name: data.name,
                    })
                    .whereNot("id", id)
                    .first();

                if (existingName) {
                    throw boom.conflict(
                        "Channel configuration with this name already exists",
                    );
                }
            }

            // Update the business channel
            const updatedBusinessChannel = await BusinessChannel.query(
                trx,
            ).patchAndFetchById(id, {
                name: data.name || businessChannel.name,
                description:
                    data.description !== undefined
                        ? data.description
                        : businessChannel.description,
                provider_id: data.provider_id || businessChannel.provider_id,
                status: data.status || businessChannel.status,
                config: data.config || businessChannel.config,
                updated_at: new Date().toISOString(),
            });

            // Get channel name
            const channel = await Channel.query(trx)
                .modify("notDeleted")
                .findById(businessChannel.channel_id);

            logger.info("Business channel updated successfully", {
                businessChannelId: id,
                businessId: businessId,
            });

            return {
                ...updatedBusinessChannel,
                channel_name: channel ? channel.name : null,
            };
        } catch (error) {
            if (error.isBoom) {
                throw error;
            }
            logger.error(`Error updating business channel ${id}:`, error);
            if (error.code === "23505") {
                throw boom.conflict(
                    "Channel configuration with this name already exists",
                );
            }
            throw boom.badImplementation("Failed to update business channel");
        }
    });
}

/**
 * Delete a business channel (soft delete)
 * @param {string} id - Business channel ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Success status
 */
async function deleteBusinessChannel(id, businessId) {
    return await transaction(async (trx) => {
        try {
            // Check if business channel exists and belongs to the business
            const businessChannel = await BusinessChannel.query(trx)
                .modify("notDeleted")
                .where({
                    id: id,
                    business_id: businessId,
                })
                .first();

            if (!businessChannel) {
                throw boom.notFound("Business channel not found");
            }

            // Soft delete the business channel
            await BusinessChannel.query(trx).patchAndFetchById(id, {
                is_deleted: true,
                updated_at: new Date().toISOString(),
            });

            logger.info("Business channel deleted successfully", {
                businessChannelId: id,
                businessId: businessId,
            });

            return { success: true };
        } catch (error) {
            if (error.isBoom) {
                throw error;
            }
            logger.error(`Error deleting business channel ${id}:`, error);
            throw boom.badImplementation("Failed to delete business channel");
        }
    });
}

/**
 * Test a business channel connection
 * @param {string} id - Business channel ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Test result
 */
async function testBusinessChannel(id, businessId) {
    try {
        // Get the business channel
        const businessChannel = await BusinessChannel.query()
            .modify("notDeleted")
            .where({
                id: id,
                business_id: businessId,
            })
            .first();

        if (!businessChannel) {
            throw boom.notFound("Business channel not found");
        }

        // Get the channel to determine provider type
        const channel = await Channel.query()
            .modify("notDeleted")
            .findById(businessChannel.channel_id);

        if (!channel) {
            throw boom.notFound("Channel not found");
        }

        // Find the provider configuration based on provider_id
        const providerConfig = channel.providers_config_schema?.find(
            (provider) => provider.id === businessChannel.provider_id,
        );

        if (!providerConfig) {
            throw boom.badRequest(
                `Provider configuration not found for ID ${businessChannel.provider_id}`,
            );
        }

        // Test connection based on provider name
        let result;
        switch (providerConfig.name.toLowerCase()) {
            case "meta":
                result = await testMetaConnection(businessChannel.config);
                break;
            case "wati":
                result = await testWatiConnection(businessChannel.config);
                break;
            case "gupshup":
                result = await testGupshupConnection(businessChannel.config);
                break;
            case "karix":
                result = await testKarixConnection(businessChannel.config);
                break;
            default:
                throw boom.badRequest(
                    `Unsupported provider: ${providerConfig.name}`,
                );
        }

        return {
            success: true,
            message: `Connection successful to ${businessChannel.provider_name}`,
            details: result,
        };
    } catch (error) {
        if (error.isBoom) {
            throw error;
        }
        logger.error(`Error testing business channel ${id}:`, error);
        throw boom.badImplementation("Failed to test business channel");
    }
}

// Provider-specific operations

/**
 * Verify Meta webhook
 * @param {string} mode - Hub mode
 * @param {string} verifyToken - Verification token
 * @param {string} challenge - Challenge string
 * @param {string} expectedToken - Expected token
 * @returns {Promise<string>} - Challenge response
 */
async function verifyMetaWebhook(mode, verifyToken, challenge, expectedToken) {
    if (mode === "subscribe" && verifyToken === expectedToken) {
        return challenge;
    } else {
        throw boom.badRequest("Invalid verification request");
    }
}

/**
 * Process Meta webhook data
 * @param {Object} body - Webhook payload
 * @returns {Promise<Object>} - Processing result
 */
async function processMetaWebhook(body) {
    return await transaction(async (trx) => {
        try {
            // Implement webhook processing logic with transaction support
            logger.info("Received Meta webhook:", JSON.stringify(body));

            // Basic validation
            if (
                !body ||
                !body.object ||
                !body.entry ||
                !Array.isArray(body.entry)
            ) {
                throw boom.badRequest("Invalid webhook payload");
            }

            // Further processing would go here - store messages, update user records, etc.
            // For now, just log and return success

            return { success: true };
        } catch (error) {
            logger.error("Error processing Meta webhook:", error);
            throw boom.badImplementation("Failed to process webhook");
        }
    });
}

/**
 * Verify Wati connection
 * @param {Object} data - Connection data
 * @returns {Promise<Object>} - Verification result
 */
async function verifyWatiConnection(data) {
    try {
        const { api_endpoint_url, access_token } = data;

        const response = await axios.get(
            `${api_endpoint_url}/api/v1/getContacts`,
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
                params: {
                    pageSize: 1,
                },
            },
        );

        return {
            success: true,
            message: "Successfully connected to Wati API",
            data: response.data,
        };
    } catch (error) {
        logger.error("Error verifying Wati connection:", error);
        throw boom.badImplementation(
            `Failed to connect to Wati: ${error.message}`,
        );
    }
}

/**
 * Get Gupshup apps
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} - Apps data
 */
async function getGupshupApps(apiKey) {
    try {
        const response = await axios.get(
            "https://api.gupshup.io/sm/api/v1/users/apps",
            {
                headers: {
                    apikey: apiKey,
                },
            },
        );

        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        logger.error("Error getting Gupshup apps:", error);
        throw boom.badImplementation(
            `Failed to get Gupshup apps: ${error.message}`,
        );
    }
}

/**
 * Verify Karix credentials
 * @param {Object} data - Credentials data
 * @returns {Promise<Object>} - Verification result
 */
async function verifyKarixCredentials(data) {
    try {
        const { api_key, api_endpoint } = data;

        const response = await axios.get(`${api_endpoint}/account`, {
            headers: {
                Authorization: `Bearer ${api_key}`,
            },
        });

        return {
            success: true,
            message: "Successfully connected to Karix API",
            data: response.data,
        };
    } catch (error) {
        logger.error("Error verifying Karix credentials:", error);
        throw boom.badImplementation(
            `Failed to connect to Karix: ${error.message}`,
        );
    }
}

// Helper functions for testing provider connections

/**
 * Test Meta connection
 * @param {Object} config - Connection config
 * @returns {Promise<Object>} - Test result
 */
async function testMetaConnection(config) {
    try {
        if (!config.access_token || !config.business_account_id) {
            throw boom.badRequest(
                "Missing required Meta configuration parameters",
            );
        }

        // Try to get basic account information using the Graph API
        const response = await axios.get(
            `https://graph.facebook.com/v15.0/${config.business_account_id}`,
            {
                headers: {
                    Authorization: `Bearer ${config.access_token}`,
                },
            },
        );

        return {
            status: "connected",
            account_name: response.data.name || "Meta Business Account",
            account_id: response.data.id,
            provider_response: response.data,
        };
    } catch (error) {
        logger.error("Error testing Meta connection:", error);

        // Extract specific error from Meta API response if available
        let errorMessage = "Failed to connect to Meta";
        if (
            error.response &&
            error.response.data &&
            error.response.data.error
        ) {
            errorMessage = `Meta API error: ${error.response.data.error.message}`;
        }

        throw boom.badImplementation(errorMessage);
    }
}

/**
 * Test Wati connection
 * @param {Object} config - Connection config
 * @returns {Promise<Object>} - Test result
 */
async function testWatiConnection(config) {
    try {
        if (!config.api_endpoint_url || !config.access_token) {
            throw boom.badRequest(
                "Missing required Wati configuration parameters",
            );
        }

        // Try to get account information
        const response = await axios.get(
            `${config.api_endpoint_url}/api/v1/getContacts`,
            {
                headers: {
                    Authorization: `Bearer ${config.access_token}`,
                },
                params: {
                    pageSize: 1,
                },
            },
        );

        return {
            status: "connected",
            account_info: {
                business_number:
                    config.whatsapp_business_number || "Not specified",
            },
            provider_response: response.data,
        };
    } catch (error) {
        logger.error("Error testing Wati connection:", error);

        let errorMessage = "Failed to connect to Wati";
        if (error.response && error.response.data) {
            errorMessage = `Wati API error: ${
                error.response.data.message || error.message
            }`;
        }

        throw boom.badImplementation(errorMessage);
    }
}

/**
 * Test Gupshup connection
 * @param {Object} config - Connection config
 * @returns {Promise<Object>} - Test result
 */
async function testGupshupConnection(config) {
    try {
        if (!config.api_key) {
            throw boom.badRequest(
                "Missing required Gupshup configuration parameters",
            );
        }

        // Try to get apps list
        const response = await axios.get(
            "https://api.gupshup.io/sm/api/v1/users/apps",
            {
                headers: {
                    apikey: config.api_key,
                },
            },
        );

        return {
            status: "connected",
            account_info: {
                app_name: config.app_name || "Not specified",
                app_id: config.app_id || "Not specified",
            },
            provider_response: response.data,
        };
    } catch (error) {
        logger.error("Error testing Gupshup connection:", error);

        let errorMessage = "Failed to connect to Gupshup";
        if (error.response && error.response.data) {
            errorMessage = `Gupshup API error: ${
                error.response.data.message || error.message
            }`;
        }

        throw boom.badImplementation(errorMessage);
    }
}

/**
 * Test Karix connection
 * @param {Object} config - Connection config
 * @returns {Promise<Object>} - Test result
 */
async function testKarixConnection(config) {
    try {
        if (!config.api_key || !config.api_endpoint) {
            throw boom.badRequest(
                "Missing required Karix configuration parameters",
            );
        }

        // Try to get account information
        const response = await axios.get(`${config.api_endpoint}/account`, {
            headers: {
                Authorization: `Bearer ${config.api_key}`,
            },
        });

        return {
            status: "connected",
            account_info: {
                sender_id: config.sender_id || "Not specified",
                api_version: config.api_version || "Not specified",
            },
            provider_response: response.data,
        };
    } catch (error) {
        logger.error("Error testing Karix connection:", error);

        let errorMessage = "Failed to connect to Karix";
        if (error.response && error.response.data) {
            errorMessage = `Karix API error: ${
                error.response.data.message || error.message
            }`;
        }

        throw boom.badImplementation(errorMessage);
    }
}

module.exports = {
    // Channel operations
    getAllChannels,
    getChannelById,
    createChannel,
    updateChannel,
    deleteChannel,

    // Business channel operations
    getBusinessChannels,
    getBusinessChannelById,
    createBusinessChannel,
    updateBusinessChannel,
    deleteBusinessChannel,
    testBusinessChannel,

    // Provider-specific operations
    verifyMetaWebhook,
    processMetaWebhook,
    verifyWatiConnection,
    getGupshupApps,
    verifyKarixCredentials,
};
