// api/Broadcast/controller.js
const boom = require("@hapi/boom");
const service = require("./service");
const campaignService = require("../Campaign/service");
const businessChannelService = require("../Channel/service");
const templateService = require("../Templates/service");
const contactGroupService = require("../Contacts/service");
const agentService = require("../Agents/service");
const logger = require("../../system/utils/logger");

/**
 * Create a new broadcast
 * @param {string} campaignId - Campaign ID
 * @param {Object} broadcastData - Broadcast data
 * @param {Object} req - Request object
 */
const createBroadcast = async (campaignId, broadcastData, req) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId;

    // Step 1: Validate and fetch all required entities
    const { campaign, businessChannel, template, contactGroup } =
      await validateAndFetchEntities(campaignId, broadcastData, businessId);

    const broadcast = await service.createBroadcast(
      campaign,
      businessChannel,
      template,
      contactGroup,
      broadcastData,
      businessId,
      userId,
    );

    return {
      success: true,
      statusCode: 201,
      data: broadcast,
    };
  } catch (error) {
    logger.error(
      `Error in createBroadcast controller for campaign ${campaignId}:`,
      error,
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to create broadcast");
  }
};

/**
 * Update an existing broadcast
 * @param {string} broadcastId - Broadcast ID
 * @param {Object} broadcastData - Updated broadcast data
 * @param {Object} req - Request object
 */
const updateBroadcast = async (broadcastId, broadcastData, req) => {
  try {
    const businessId = req.user.businessId;

    const updatedBroadcast = await broadcastService.updateBroadcast(
      broadcastId,
      broadcastData,
      businessId,
    );

    return {
      success: true,
      data: updatedBroadcast,
    };
  } catch (error) {
    logger.error(
      `Error in updateBroadcast controller for ${broadcastId}:`,
      error,
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to update broadcast");
  }
};

/**
 * Delete a broadcast
 * @param {string} broadcastId - Broadcast ID
 * @param {Object} req - Request object
 */
const deleteBroadcast = async (broadcastId, req) => {
  try {
    const businessId = req.user.businessId;

    await broadcastService.deleteBroadcast(broadcastId, businessId);

    return {
      success: true,
      message: "Broadcast deleted successfully",
    };
  } catch (error) {
    logger.error(
      `Error in deleteBroadcast controller for ${broadcastId}:`,
      error,
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to delete broadcast");
  }
};

/**
 * Update broadcast status
 * @param {string} broadcastId - Broadcast ID
 * @param {Object} statusData - New status data
 * @param {Object} req - Request object
 */
const updateBroadcastStatus = async (broadcastId, statusData, req) => {
  try {
    const businessId = req.user.businessId;

    const updatedBroadcast = await broadcastService.updateBroadcastStatus(
      broadcastId,
      statusData.status,
      businessId,
    );

    return {
      success: true,
      data: updatedBroadcast,
    };
  } catch (error) {
    logger.error(
      `Error in updateBroadcastStatus controller for ${broadcastId}:`,
      error,
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to update broadcast status");
  }
};

/**
 * Clone a broadcast
 * @param {string} broadcastId - Broadcast ID to clone
 * @param {Object} cloneData - Clone data
 * @param {Object} req - Request object
 */
const cloneBroadcast = async (broadcastId, cloneData, req) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId;

    const clonedBroadcast = await broadcastService.cloneBroadcast(
      broadcastId,
      cloneData,
      businessId,
      userId,
    );

    return {
      success: true,
      data: clonedBroadcast,
    };
  } catch (error) {
    logger.error(
      `Error in cloneBroadcast controller for ${broadcastId}:`,
      error,
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to clone broadcast");
  }
};

/**
 * Get broadcast analytics
 * @param {string} broadcastId - Broadcast ID
 * @param {Object} req - Request object
 */
const getBroadcastAnalytics = async (broadcastId, req) => {
  try {
    const businessId = req.user.businessId;
    const options = {
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      granularity: req.query.granularity || "hourly",
    };

    const analytics = await broadcastService.getBroadcastAnalytics(
      broadcastId,
      options,
      businessId,
    );

    return {
      success: true,
      data: analytics,
    };
  } catch (error) {
    logger.error(
      `Error in getBroadcastAnalytics controller for ${broadcastId}:`,
      error,
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get broadcast analytics");
  }
};

/**
 * Export broadcast analytics
 * @param {string} broadcastId - Broadcast ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const exportBroadcastAnalytics = async (broadcastId, req, res) => {
  try {
    const businessId = req.user.businessId;
    const options = {
      format: req.query.format || "csv",
      include_recipients: req.query.include_recipients === "true",
      include_messages: req.query.include_messages === "true",
    };

    const result = await broadcastService.exportBroadcastAnalytics(
      broadcastId,
      options,
      businessId,
    );

    // Set headers for file download
    res.setHeader("Content-Type", result.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`,
    );

    // Send the file
    res.sendFile(result.filePath);
  } catch (error) {
    logger.error(
      `Error in exportBroadcastAnalytics controller for ${broadcastId}:`,
      error,
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to export broadcast analytics");
  }
};

/**
 * Retarget failed recipients
 * @param {string} broadcastId - Original broadcast ID
 * @param {Object} retargetData - Retargeting data
 * @param {Object} req - Request object
 */
const retargetFailedRecipients = async (broadcastId, retargetData, req) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId;

    const retargetBroadcast = await broadcastService.retargetFailedRecipients(
      broadcastId,
      retargetData,
      businessId,
      userId,
    );

    return {
      success: true,
      data: retargetBroadcast,
    };
  } catch (error) {
    logger.error(
      `Error in retargetFailedRecipients controller for ${broadcastId}:`,
      error,
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to retarget failed recipients");
  }
};

/////////////////////////////////helper functions///////////////////////////////////////
// These functions are not directly related to the controller logic but are used within the controller methods.

/**
 * Validate and fetch all related entities for broadcast
 */
const validateAndFetchEntities = async (campaignId, data, businessId) => {
  // Validate input data
  if (!campaignId || !data || !businessId) {
    throw boom.badRequest("Missing required parameters");
  }

  if (
    !data.business_channel_id ||
    !data.template_id ||
    !data.contact_group_id
  ) {
    throw boom.badRequest("Missing required fields in broadcast data");
  }

  // Fetch all entities in parallel
  const [campaign, businessChannel, template, contactGroup] = await Promise.all(
    [
      campaignService.getCampaignById(campaignId, businessId),
      businessChannelService.getBusinessChannelById(
        data.business_channel_id,
        businessId,
      ),
      templateService.getTemplateById(data.template_id),
      contactGroupService.getContactGroupById(
        data.contact_group_id,
        businessId,
      ),
    ],
  );

  // Validate fetched entities
  if (!campaign) {
    throw boom.notFound(
      "Campaign not found or doesn't belong to this business",
    );
  }
  if (!businessChannel) {
    throw boom.notFound(
      "Business channel not found or doesn't belong to this business",
    );
  }
  if (!template) {
    throw boom.notFound(
      "Template not found or doesn't belong to this business",
    );
  }
  if (!contactGroup) {
    throw boom.notFound(
      "Contact group not found or doesn't belong to this business",
    );
  }

  // Validate agent mapping if provided
  if (data.agent_mapping) {
    await validateAgentMapping(data.agent_mapping, businessId);
  }

  return { campaign, businessChannel, template, contactGroup };
};

/**
 * Validate agent mapping against business agents
 */
const validateAgentMapping = async (agentMapping, businessId) => {
  const agentIds = Object.values(agentMapping);
  if (agentIds.length === 0) return;

  const agents = await agentService.getAgentsByIds(agentIds, businessId);

  const agentMap = agents.reduce((map, agent) => {
    map[agent.id] = agent;
    return map;
  }, {});

  for (const [buttonKey, agentId] of Object.entries(agentMapping)) {
    if (!agentMap[agentId]) {
      throw boom.notFound(
        `Agent with ID ${agentId} not found or doesn't belong to this business`,
      );
    }
  }
};

module.exports = {
  createBroadcast,
  updateBroadcast,
  deleteBroadcast,
  updateBroadcastStatus,
  cloneBroadcast,
  getBroadcastAnalytics,
  exportBroadcastAnalytics,
  retargetFailedRecipients,
};
