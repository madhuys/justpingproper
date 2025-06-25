const boom = require("@hapi/boom");
const logger = require("../../system/utils/logger");
const { transaction } = require("../../system/db/database");
const Campaign = require("../../system/models/Campaign");
const Broadcast = require("../../system/models/Broadcast");
const Channel = require("../../system/models/Channel");
const Business = require("../../system/models/Business");

/**
 * Get all campaigns for a business with filtering and pagination
 * @param {Object} filters - Query filters
 * @param {Object} pagination - Pagination parameters
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Campaigns and pagination info
 */
async function getAllCampaigns(filters = {}, pagination = {}, businessId) {
    try {
        // Validate business exists
        const business = await Business.query().findById(businessId);
        if (!business) {
            throw boom.notFound("Business not found");
        }

        // Get all campaigns with pagination and filtering
        const result = await Campaign.findByBusinessId(
            businessId,
            filters,
            pagination,
        );

        // Enhance the response with channel names and broadcast counts
        const enhancedData = await Promise.all(
            result.data.map(async (campaign) => {
                // Get broadcast count
                const broadcastCount = await Broadcast.query()
                    .where("campaign_id", campaign.id)
                    .count("id as count")
                    .first();

                // Get analytics summary if available
                const analytics = await getAggregatedAnalytics(campaign.id);

                return {
                    id: campaign.id,
                    name: campaign.name,
                    description: campaign.description,
                    type: campaign.type,
                    status: campaign.status,
                    channel_id: campaign.channel_id,
                    channel_name: campaign.channel
                        ? campaign.channel.name
                        : null,
                    created_by: campaign.creator
                        ? {
                              id: campaign.creator.id,
                              name: `${campaign.creator.first_name} ${campaign.creator.last_name}`,
                          }
                        : null,
                    created_at: campaign.created_at,
                    updated_at: campaign.updated_at,
                    metadata: campaign.metadata || {},
                    broadcast_count: parseInt(broadcastCount.count || 0),
                    analytics: analytics || {},
                };
            }),
        );

        return {
            data: enhancedData,
            pagination: result.pagination,
        };
    } catch (error) {
        logger.error("Error getting campaigns:", error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to fetch campaigns");
    }
}

/**
 * Get campaign by ID with detailed information
 * @param {string} id - Campaign ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Campaign details
 */
async function getCampaignById(id, businessId) {
    try {
        // Get the campaign with related data
        const campaign = await Campaign.query()
            .findById(id)
            .withGraphFetched("[channel, creator, broadcasts]")
            .first();

        if (!campaign) {
            throw boom.notFound("Campaign not found");
        }

        // Verify campaign belongs to the business
        if (campaign.business_id !== businessId) {
            throw boom.forbidden("Access denied to this campaign");
        }

        // Get analytics summary if available
        const analytics = await getAggregatedAnalytics(campaign.id);

        // Format response
        const result = {
            id: campaign.id,
            name: campaign.name,
            description: campaign.description,
            type: campaign.type,
            channel_id: campaign.channel_id,
            channel_name: campaign.channel ? campaign.channel.name : null,
            status: campaign.status,
            created_by: campaign.creator
                ? {
                      id: campaign.creator.id,
                      name: `${campaign.creator.first_name} ${campaign.creator.last_name}`,
                  }
                : null,
            created_at: campaign.created_at,
            updated_at: campaign.updated_at,
            metadata: campaign.metadata || {},
            broadcasts: campaign.broadcasts || [],
            analytics: analytics || {},
            aggregation: campaign.aggregation || [],
        };

        return result;
    } catch (error) {
        logger.error(`Error getting campaign by ID ${id}:`, error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to fetch campaign details");
    }
}

/**
 * Create a new campaign
 * @param {Object} data - Campaign data
 * @param {string} businessId - Business ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Created campaign
 */
async function createCampaign(data, businessId, userId) {
    return await transaction(async (trx) => {
        try {
            // Validate business channel exists and belongs to this business
            const channel = await Channel.query(trx)
                .findById(data.channel_id)
                .where("business_id", businessId)
                .first();

            if (!channel) {
                throw boom.notFound(
                    "Channel not found or doesn't belong to this business",
                );
            }

            // Create campaign
            const campaign = await Campaign.query(trx).insert({
                business_id: businessId,
                name: data.name,
                description: data.description || null,
                type: data.type,
                channel_id: data.channel_id,
                status: "draft",
                created_by: userId,
                metadata: data.metadata || {},
                aggregation: data.aggregation || [],
            });

            // Get additional data for response
            const channelName = channel.name;

            // Format response
            const result = {
                id: campaign.id,
                name: campaign.name,
                description: campaign.description,
                type: campaign.type,
                channel_id: campaign.channel_id,
                channel_name: channelName,
                status: campaign.status,
                created_by: userId,
                created_at: campaign.created_at,
                updated_at: campaign.updated_at,
                metadata: campaign.metadata || {},
                aggregation: campaign.aggregation || [],
            };

            return result;
        } catch (error) {
            logger.error("Error creating campaign:", error);
            if (error.isBoom) {
                throw error;
            }
            throw boom.badImplementation("Failed to create campaign");
        }
    });
}

/**
 * Update an existing campaign
 * @param {string} id - Campaign ID
 * @param {Object} data - Updated campaign data
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Updated campaign
 */
async function updateCampaign(id, data, businessId) {
    return await transaction(async (trx) => {
        try {
            // Check if campaign exists and belongs to this business
            const campaign = await Campaign.query(trx)
                .where({
                    id: id,
                    business_id: businessId,
                })
                .first();

            if (!campaign) {
                throw boom.notFound(
                    "Campaign not found or doesn't belong to this business",
                );
            }

            // Cannot update campaigns that are completed
            if (campaign.status === "completed") {
                throw boom.forbidden("Cannot update a completed campaign");
            }

            // Update the campaign
            const updates = {};
            if (data.name !== undefined) updates.name = data.name;
            if (data.description !== undefined)
                updates.description = data.description;
            if (data.metadata !== undefined) updates.metadata = data.metadata;
            if (data.aggregation !== undefined)
                updates.aggregation = data.aggregation;
            updates.updated_at = new Date().toISOString();

            const updatedCampaign = await Campaign.query(trx).patchAndFetchById(
                id,
                updates,
            );

            // Get additional data for response
            const channel = await Channel.query(trx)
                .findById(campaign.channel_id)
                .first();

            // Format response
            const result = {
                id: updatedCampaign.id,
                name: updatedCampaign.name,
                description: updatedCampaign.description,
                type: updatedCampaign.type,
                channel_id: updatedCampaign.channel_id,
                channel_name: channel ? channel.name : null,
                status: updatedCampaign.status,
                created_at: updatedCampaign.created_at,
                updated_at: updatedCampaign.updated_at,
                metadata: updatedCampaign.metadata || {},
                aggregation: updatedCampaign.aggregation || [],
            };

            return result;
        } catch (error) {
            logger.error(`Error updating campaign ${id}:`, error);
            if (error.isBoom) {
                throw error;
            }
            throw boom.badImplementation("Failed to update campaign");
        }
    });
}

/**
 * Update campaign status
 * @param {string} id - Campaign ID
 * @param {string} status - New status
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Updated campaign status
 */
async function updateCampaignStatus(id, status, businessId) {
    try {
        // Check if campaign exists and belongs to this business
        const campaign = await Campaign.query()
            .where({
                id: id,
                business_id: businessId,
            })
            .first();

        if (!campaign) {
            throw boom.notFound(
                "Campaign not found or doesn't belong to this business",
            );
        }

        // Validate status transitions
        validateStatusTransition(campaign.status, status);

        // Update status
        const updatedCampaign = await Campaign.query().patchAndFetchById(id, {
            status: status,
            updated_at: new Date().toISOString(),
        });

        return {
            id: updatedCampaign.id,
            name: updatedCampaign.name,
            status: updatedCampaign.status,
            updated_at: updatedCampaign.updated_at,
        };
    } catch (error) {
        logger.error(`Error updating campaign status ${id}:`, error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to update campaign status");
    }
}

/**
 * Delete a campaign
 * @param {string} id - Campaign ID
 * @param {string} businessId - Business ID
 * @returns {Promise<boolean>} - Success flag
 */
async function deleteCampaign(id, businessId) {
    return await transaction(async (trx) => {
        try {
            // Check if campaign exists and belongs to this business
            const campaign = await Campaign.query(trx)
                .where({
                    id: id,
                    business_id: businessId,
                })
                .first();

            if (!campaign) {
                throw boom.notFound(
                    "Campaign not found or doesn't belong to this business",
                );
            }

            // Cannot delete active campaigns
            if (campaign.status === "active") {
                throw boom.forbidden(
                    "Cannot delete an active campaign. Pause it first.",
                );
            }

            // Check if campaign has broadcasts
            const broadcastCount = await Broadcast.query(trx)
                .where("campaign_id", id)
                .count("id as count")
                .first();

            if (parseInt(broadcastCount.count) > 0) {
                // Soft delete by updating is_deleted flag
                await Campaign.query(trx)
                    .patch({
                        is_deleted: true,
                        updated_at: new Date().toISOString(),
                    })
                    .where("id", id);
            } else {
                // Hard delete if no broadcasts
                await Campaign.query(trx).deleteById(id);
            }

            return true;
        } catch (error) {
            logger.error(`Error deleting campaign ${id}:`, error);
            if (error.isBoom) {
                throw error;
            }
            throw boom.badImplementation("Failed to delete campaign");
        }
    });
}

/**
 * Helper function to validate campaign status transitions
 * @param {string} currentStatus - Current status
 * @param {string} newStatus - New status
 */
function validateStatusTransition(currentStatus, newStatus) {
    // Define allowed transitions
    const allowedTransitions = {
        draft: ["active", "paused", "completed"],
        active: ["paused", "completed"],
        paused: ["active", "completed"],
        completed: [], // No transitions allowed from completed
    };

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
        throw boom.badRequest(
            `Cannot transition campaign from '${currentStatus}' to '${newStatus}'`,
        );
    }
}

/**
 * Helper function to aggregate analytics from broadcasts
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>} - Aggregated analytics
 */
async function getAggregatedAnalytics(campaignId) {
    try {
        // Get all completed broadcasts for this campaign
        const broadcasts = await Broadcast.query()
            .where("campaign_id", campaignId)
            .where("status", "completed");

        // If no broadcasts, return empty analytics
        if (!broadcasts || broadcasts.length === 0) {
            return null;
        }

        // Aggregate analytics across all broadcasts
        return broadcasts.reduce((totals, broadcast) => {
            if (!broadcast.analytics) return totals;

            // Initialize totals if first broadcast with analytics
            if (!totals) {
                return { ...broadcast.analytics };
            }

            // Add this broadcast's metrics to totals
            Object.keys(broadcast.analytics).forEach((key) => {
                if (typeof broadcast.analytics[key] === "number") {
                    totals[key] = (totals[key] || 0) + broadcast.analytics[key];
                }
            });

            return totals;
        }, null);
    } catch (error) {
        logger.error(
            `Error aggregating analytics for campaign ${campaignId}:`,
            error,
        );
        return null;
    }
}

module.exports = {
    getAllCampaigns,
    getCampaignById,
    createCampaign,
    updateCampaign,
    updateCampaignStatus,
    deleteCampaign,
};
