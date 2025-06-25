// api/Channel/controller.js
const boom = require("@hapi/boom");
const service = require("./service");
const logger = require("../../system/utils/logger");
const {
    extractPaginationParams,
    extractFilters,
} = require("../../system/utils/pagination");

// Update getAllChannels controller function
module.exports.getAllChannels = async (req) => {
    try {
        // Extract pagination params using the utility
        const pagination = extractPaginationParams(req.query);

        // Extract filters, removing pagination params
        const filters = extractFilters(req.query);

        const result = await service.getAllChannels(filters, pagination);

        return {
            success: true,
            data: result.data,
            pagination: result.pagination,
        };
    } catch (error) {
        logger.error("Error in getAllChannels controller:", error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to fetch channels");
    }
};

/**
 * Get channel by ID controller
 * @param {String} channelId - Channel ID
 * @returns {Promise<Object>} - Response
 */
module.exports.getChannelById = async (channelId) => {
    try {
        if (!channelId) {
            throw boom.badRequest("Channel ID is required");
        }

        const channel = await service.getChannelById(channelId);

        return {
            success: true,
            data: channel,
        };
    } catch (error) {
        logger.error(
            `Error in getChannelById controller for ${channelId}:`,
            error,
        );

        // Make sure we properly check and rethrow boom errors
        if (error && error.isBoom) {
            throw error;
        }

        throw boom.badImplementation("Failed to fetch channel");
    }
};

module.exports.createChannel = async (channelData, userId, businessId) => {
    try {
        const channel = await service.createChannel(
            channelData,
            userId,
            businessId,
        );
        return {
            success: true,
            statusCode: 201,
            message: "Channel created successfully",
            data: channel,
        };
    } catch (error) {
        logger.error("Error in createChannel controller:", error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to create channel");
    }
};

module.exports.updateChannel = async (channelId, channelData) => {
    try {
        logger.info(`Updating channel with ID: ${channelId}`, { channelData });
        const channel = await service.updateChannel(channelId, channelData);
        return {
            success: true,
            message: "Channel updated successfully",
            data: channel,
        };
    } catch (error) {
        logger.error(
            `Error in updateChannel controller for ${channelId}:`,
            error,
        );

        // Provide more specific error messages based on error type
        if (error.isBoom) {
            throw error;
        } else if (error.code === "23505") {
            throw boom.conflict("Channel with this name already exists");
        } else if (error.message && error.message.includes("not found")) {
            throw boom.notFound("Channel not found");
        } else if (error.message && error.message.includes("validation")) {
            throw boom.badRequest(error.message);
        }

        throw boom.badImplementation("Failed to update channel");
    }
};

module.exports.deleteChannel = async (channelId) => {
    try {
        await service.deleteChannel(channelId);
        return {
            success: true,
            message: "Channel deleted successfully",
        };
    } catch (error) {
        logger.error(
            `Error in deleteChannel controller for ${channelId}:`,
            error,
        );
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to delete channel");
    }
};

// Business Channel Operations
module.exports.getBusinessChannels = async (req) => {
    try {
        const businessId = req.user.businessId;

        // Extract pagination params using the utility
        const pagination = extractPaginationParams(req.query);

        // Extract filters, removing pagination params and adding business_id
        const filters = extractFilters(req.query, { business_id: businessId });

        const result = await service.getBusinessChannels(filters, pagination);

        return {
            success: true,
            data: result.data,
            pagination: result.pagination,
        };
    } catch (error) {
        logger.error("Error in getBusinessChannels controller:", error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to fetch business channels");
    }
};

module.exports.getBusinessChannelById = async (req) => {
    try {
        const businessId = req.user.businessId;
        const { businessChannelId } = req.params;
        const businessChannel = await service.getBusinessChannelById(
            businessChannelId,
            businessId,
        );

        return {
            success: true,
            data: businessChannel,
        };
    } catch (error) {
        logger.error(
            `Error in getBusinessChannelById controller for ${req.params.businessChannelId}:`,
            error,
        );
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to fetch business channel");
    }
};

module.exports.createBusinessChannel = async (req) => {
    try {
        const businessId = req.user.businessId;
        const userId = req.user.userId;
        const businessChannelData = req.body;

        // Add validation for required data
        if (
            !businessChannelData ||
            !businessChannelData.channel_id ||
            !businessChannelData.provider_id ||
            !businessChannelData.config
        ) {
            throw boom.badRequest(
                "Missing required channel configuration data",
            );
        }

        const businessChannel = await service.createBusinessChannel(
            businessId,
            userId,
            businessChannelData,
        );

        return {
            success: true,
            statusCode: 201,
            message: "Channel configuration successfully created",
            data: businessChannel,
        };
    } catch (error) {
        // Proper error logging and handling
        logger.error("Error creating business channel:", error);

        // Return appropriate error based on type
        if (error.isBoom) {
            throw error;
        }

        throw boom.badImplementation("Failed to create business channel");
    }
};

module.exports.updateBusinessChannel = async (req) => {
    try {
        const businessId = req.user.businessId;
        const { businessChannelId } = req.params;
        const updateData = req.body;

        const businessChannel = await service.updateBusinessChannel(
            businessChannelId,
            businessId,
            updateData,
        );

        return {
            success: true,
            message: "Channel configuration successfully updated",
            data: businessChannel,
        };
    } catch (error) {
        logger.error(
            `Error in updateBusinessChannel controller for ${req.params.businessChannelId}:`,
            error,
        );
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to update business channel");
    }
};

module.exports.deleteBusinessChannel = async (req) => {
    try {
        const businessId = req.user.businessId;
        const { businessChannelId } = req.params;

        await service.deleteBusinessChannel(businessChannelId, businessId);

        return {
            success: true,
            message: "Channel configuration successfully deleted",
        };
    } catch (error) {
        logger.error(
            `Error in deleteBusinessChannel controller for ${req.params.businessChannelId}:`,
            error,
        );
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to delete business channel");
    }
};

module.exports.testBusinessChannel = async (req) => {
    try {
        const businessId = req.user.businessId;
        const { businessChannelId } = req.params;

        const result = await service.testBusinessChannel(
            businessChannelId,
            businessId,
        );

        return result;
    } catch (error) {
        logger.error(
            `Error in testBusinessChannel controller for ${req.params.businessChannelId}:`,
            error,
        );
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to test business channel");
    }
};

// Provider-specific operations
module.exports.verifyMetaWebhook = async (req, res) => {
    try {
        const {
            "hub.mode": mode,
            "hub.verify_token": verifyToken,
            "hub.challenge": challenge,
        } = req.query;
        const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

        return await service.verifyMetaWebhook(
            mode,
            verifyToken,
            challenge,
            expectedToken,
        );
    } catch (error) {
        logger.error("Error in verifyMetaWebhook controller:", error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to verify Meta webhook");
    }
};

module.exports.processMetaWebhook = async (req) => {
    try {
        return await service.processMetaWebhook(req.body);
    } catch (error) {
        logger.error("Error in processMetaWebhook controller:", error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to process Meta webhook");
    }
};

module.exports.verifyWatiConnection = async (req) => {
    try {
        return await service.verifyWatiConnection(req.body);
    } catch (error) {
        logger.error("Error in verifyWatiConnection controller:", error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to verify Wati connection");
    }
};

module.exports.getGupshupApps = async (req) => {
    try {
        const { api_key } = req.query;
        return await service.getGupshupApps(api_key);
    } catch (error) {
        logger.error("Error in getGupshupApps controller:", error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to get Gupshup apps");
    }
};

module.exports.verifyKarixCredentials = async (req) => {
    try {
        return await service.verifyKarixCredentials(req.body);
    } catch (error) {
        logger.error("Error in verifyKarixCredentials controller:", error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to verify Karix credentials");
    }
};
