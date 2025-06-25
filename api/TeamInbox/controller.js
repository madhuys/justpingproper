// api/TeamInbox/controller.js
const boom = require("@hapi/boom");
const service = require("./service");
const logger = require("../../system/utils/logger");

/**
 * Get conversations with filtering and pagination
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const getConversations = async (req) => {
  try {
    const businessId = req.user.businessId;
    const result = await service.getConversations(businessId, req.query);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("Get conversations error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get conversations");
  }
};

/**
 * Get conversation details with message history
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const getConversationDetails = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { conversationId } = req.params;

    const result = await service.getConversationDetails(
      conversationId,
      businessId,
      req.query
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("Get conversation details error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get conversation details");
  }
};

/**
 * Update conversation status
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const updateConversationStatus = async (req) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId;
    const { conversationId } = req.params;

    const result = await service.updateStatus(
      conversationId,
      businessId,
      req.body,
      userId
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("Update conversation status error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to update conversation status");
  }
};

/**
 * Assign conversation to user and/or team
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const assignConversation = async (req) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId;
    const { conversationId } = req.params;

    const result = await service.assignConversation(
      conversationId,
      businessId,
      req.body,
      userId
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("Assign conversation error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to assign conversation");
  }
};

/**
 * Send a message in a conversation
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const sendMessage = async (req) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId;
    const { conversationId } = req.params;

    const result = await service.sendMessage(
      conversationId,
      businessId,
      req.body,
      userId
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("Send message error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to send message");
  }
};

/**
 * Send an internal note in a conversation
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const sendNote = async (req) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId;
    const { conversationId } = req.params;

    const result = await service.sendNote(
      conversationId,
      businessId,
      req.body,
      userId
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("Send note error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to send note");
  }
};

/**
 * Add a tag to a conversation
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const addTag = async (req) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId;
    const { conversationId } = req.params;
    const { tag_id } = req.body;

    const result = await service.addTag(
      conversationId,
      businessId,
      tag_id,
      userId
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("Add tag error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to add tag");
  }
};

/**
 * Remove a tag from a conversation
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const removeTag = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { conversationId, tagId } = req.params;

    const result = await service.removeTag(conversationId, businessId, tagId);

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    logger.error("Remove tag error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to remove tag");
  }
};

/**
 * Get conversation statistics
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const getStatistics = async (req) => {
  try {
    const businessId = req.user.businessId;

    const result = await service.getStatistics(businessId, req.query);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("Get statistics error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get statistics");
  }
};

/**
 * Create a new tag
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const createTag = async (req) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId;

    const result = await service.createTag(businessId, req.body, userId);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("Create tag error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to create tag");
  }
};

/**
 * Get all tags for a business
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const getTags = async (req) => {
  try {
    const businessId = req.user.businessId;

    const result = await service.getTags(businessId);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("Get tags error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get tags");
  }
};

module.exports = {
  getConversations,
  getConversationDetails,
  updateConversationStatus,
  assignConversation,
  sendMessage,
  sendNote,
  addTag,
  removeTag,
  getStatistics,
  createTag,
  getTags,
};
