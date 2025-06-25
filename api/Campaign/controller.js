const boom = require("@hapi/boom");
const campaignService = require("./service");
const logger = require("../../system/utils/logger");
const {
    extractPaginationParams,
    extractFilters,
} = require("../../system/utils/pagination");

/**
 * Get all campaigns with filtering and pagination
 * @param {Object} req - Request object
 */
const getAllCampaigns = async (req) => {
    try {
        // Extract pagination parameters using the utility function
        const pagination = extractPaginationParams(req.query);

        // Extract filters, removing pagination params
        const filters = extractFilters(req.query, {
            // Include any additional filter overrides here
            type: req.query.type,
            status: req.query.status,
            search: req.query.search,
        });

        // Get the business ID from authenticated user
        const businessId = req.user.businessId;

        const result = await campaignService.getAllCampaigns(
            filters,
            pagination,
            businessId,
        );

        return result;
    } catch (error) {
        logger.error("Error in getAllCampaigns controller:", error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to fetch campaigns");
    }
};

/**
 * Get campaign by ID
 * @param {string} campaignId - Campaign ID
 * @param {Object} req - Request object
 */
const getCampaignById = async (campaignId, req) => {
    try {
        if (!campaignId) {
            throw boom.badRequest("Campaign ID is required");
        }

        const businessId = req.user.businessId;
        const campaign = await campaignService.getCampaignById(
            campaignId,
            businessId,
        );

        return {
            success: true,
            data: campaign,
        };
    } catch (error) {
        logger.error(
            `Error in getCampaignById controller for ${campaignId}:`,
            error,
        );
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to fetch campaign");
    }
};

/**
 * Create a new campaign
 * @param {Object} campaignData - Campaign data
 * @param {Object} req - Request object
 */
const createCampaign = async (campaignData, req) => {
    try {
        const businessId = req.user.businessId;
        const userId = req.user.userId;

        const campaign = await campaignService.createCampaign(
            campaignData,
            businessId,
            userId,
        );

        return {
            success: true,
            statusCode: 201,
            data: campaign,
        };
    } catch (error) {
        logger.error("Error in createCampaign controller:", error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to create campaign");
    }
};

/**
 * Update an existing campaign
 * @param {string} campaignId - Campaign ID
 * @param {Object} campaignData - Updated campaign data
 * @param {Object} req - Request object
 */
const updateCampaign = async (campaignId, campaignData, req) => {
    try {
        const businessId = req.user.businessId;

        const updatedCampaign = await campaignService.updateCampaign(
            campaignId,
            campaignData,
            businessId,
        );

        return {
            success: true,
            data: updatedCampaign,
        };
    } catch (error) {
        logger.error(
            `Error in updateCampaign controller for ${campaignId}:`,
            error,
        );
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to update campaign");
    }
};

/**
 * Delete a campaign
 * @param {string} campaignId - Campaign ID
 * @param {Object} req - Request object
 */
const deleteCampaign = async (campaignId, req) => {
    try {
        const businessId = req.user.businessId;

        await campaignService.deleteCampaign(campaignId, businessId);

        return {
            success: true,
            message: "Campaign deleted successfully",
        };
    } catch (error) {
        logger.error(
            `Error in deleteCampaign controller for ${campaignId}:`,
            error,
        );
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to delete campaign");
    }
};

/**
 * Update campaign status
 * @param {string} campaignId - Campaign ID
 * @param {Object} statusData - New status data
 * @param {Object} req - Request object
 */
const updateCampaignStatus = async (campaignId, statusData, req) => {
    try {
        const businessId = req.user.businessId;

        const updatedCampaign = await campaignService.updateCampaignStatus(
            campaignId,
            statusData.status,
            businessId,
        );

        return {
            success: true,
            data: updatedCampaign,
        };
    } catch (error) {
        logger.error(
            `Error in updateCampaignStatus controller for ${campaignId}:`,
            error,
        );
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to update campaign status");
    }
};

module.exports = {
    getAllCampaigns,
    getCampaignById,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    updateCampaignStatus,
};
