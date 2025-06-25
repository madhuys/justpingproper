// api/TeamInbox/service.js
const boom = require("@hapi/boom");
const repository = require("./repository");
const logger = require("../../system/utils/logger");

/**
 * Get conversations with filtering and pagination
 * @param {string} businessId - Business ID
 * @param {Object} queryParams - Query parameters for filtering and pagination
 * @returns {Promise<Object>} Paginated conversations
 */
const getConversations = async (businessId, queryParams) => {
  try {
    const {
      status,
      campaign_id,
      broadcast_id,
      search,
      timeframe,
      assigned_to,
      assigned_team,
      page = 1,
      limit = 20,
      sort_by = "last_message_at",
      sort_direction = "desc",
    } = queryParams;

    // Build filters object
    const filters = {
      status,
      campaign_id,
      broadcast_id,
      search,
      timeframe,
      assigned_to,
      assigned_team,
    };

    // Remove undefined filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await repository.findConversations(
      businessId,
      filters,
      page,
      limit,
      sort_by,
      sort_direction
    );

    return result;
  } catch (error) {
    logger.error("Error in getConversations service:", error);
    throw error.isBoom
      ? error
      : boom.badImplementation("Failed to get conversations");
  }
};

/**
 * Get conversation details with message history
 * @param {string} conversationId - Conversation ID
 * @param {string} businessId - Business ID
 * @param {Object} queryParams - Query parameters for pagination
 * @returns {Promise<Object>} Conversation with messages
 */
const getConversationDetails = async (
  conversationId,
  businessId,
  queryParams
) => {
  try {
    const { page = 1, limit = 50 } = queryParams;

    const conversation = await repository.getConversationById(
      conversationId,
      businessId,
      page,
      limit
    );

    if (!conversation) {
      throw boom.notFound("Conversation not found");
    }

    return { conversation };
  } catch (error) {
    logger.error(
      `Error in getConversationDetails service for ${conversationId}:`,
      error
    );
    throw error.isBoom
      ? error
      : boom.badImplementation("Failed to get conversation details");
  }
};

/**
 * Update conversation status
 * @param {string} conversationId - Conversation ID
 * @param {string} businessId - Business ID
 * @param {Object} updateData - Status update data
 * @param {string} userId - User ID making the change
 * @returns {Promise<Object>} Updated conversation
 */
const updateStatus = async (conversationId, businessId, updateData, userId) => {
  try {
    const { status, note } = updateData;

    // Check if conversation exists
    const conversation = await repository.getConversationById(
      conversationId,
      businessId
    );
    if (!conversation) {
      throw boom.notFound("Conversation not found");
    }

    // Update status
    const updatedConversation = await repository.updateConversationStatus(
      conversationId,
      businessId,
      status,
      userId
    );

    // If there's a note, add it as an internal message
    if (note) {
      await repository.createMessage(conversationId, businessId, {
        sender_type: "business_user",
        sender_id: userId,
        content: `Status changed to ${status}: ${note}`,
        content_type: "text",
        is_internal: true,
      });
    }

    return {
      conversation: {
        id: updatedConversation.id,
        status: updatedConversation.status,
        updated_at: updatedConversation.updated_at,
        updated_by: {
          id: userId,
        },
      },
    };
  } catch (error) {
    logger.error(`Error in updateStatus service for ${conversationId}:`, error);
    throw error.isBoom
      ? error
      : boom.badImplementation("Failed to update conversation status");
  }
};

/**
 * Assign conversation to user and/or team
 * @param {string} conversationId - Conversation ID
 * @param {string} businessId - Business ID
 * @param {Object} assignData - Assignment data
 * @param {string} userId - User ID making the change
 * @returns {Promise<Object>} Updated conversation
 */
const assignConversation = async (
  conversationId,
  businessId,
  assignData,
  userId
) => {
  try {
    const { assigned_user_id, assigned_team_id, note } = assignData;

    // Check if conversation exists
    const conversation = await repository.getConversationById(
      conversationId,
      businessId
    );
    if (!conversation) {
      throw boom.notFound("Conversation not found");
    }

    // Update assignment
    const updatedConversation = await repository.assignConversation(
      conversationId,
      businessId,
      assigned_user_id,
      assigned_team_id,
      userId
    );

    // If there's a note, add it as an internal message
    if (note) {
      await repository.createMessage(conversationId, businessId, {
        sender_type: "business_user",
        sender_id: userId,
        content: `Assignment changed: ${note}`,
        content_type: "text",
        is_internal: true,
      });
    }

    return { conversation: updatedConversation };
  } catch (error) {
    logger.error(
      `Error in assignConversation service for ${conversationId}:`,
      error
    );
    throw error.isBoom
      ? error
      : boom.badImplementation("Failed to assign conversation");
  }
};

/**
 * Send a message in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} businessId - Business ID
 * @param {Object} messageData - Message data
 * @param {string} userId - User ID sending the message
 * @returns {Promise<Object>} Created message
 */
const sendMessage = async (conversationId, businessId, messageData, userId) => {
  try {
    // Check if conversation exists
    const conversation = await repository.getConversationById(
      conversationId,
      businessId
    );
    if (!conversation) {
      throw boom.notFound("Conversation not found");
    }

    // Check if conversation is closed
    if (conversation.status === "closed" && !messageData.is_internal) {
      throw boom.conflict("Cannot send messages to a closed conversation");
    }

    // Prepare message data
    const message = await repository.createMessage(conversationId, businessId, {
      ...messageData,
      sender_type: "business_user",
      sender_id: userId,
    });

    return { message };
  } catch (error) {
    logger.error(`Error in sendMessage service for ${conversationId}:`, error);
    throw error.isBoom
      ? error
      : boom.badImplementation("Failed to send message");
  }
};

/**
 * Send an internal note in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} businessId - Business ID
 * @param {Object} noteData - Note data
 * @param {string} userId - User ID sending the note
 * @returns {Promise<Object>} Created note
 */
const sendNote = async (conversationId, businessId, noteData, userId) => {
  try {
    // Check if conversation exists
    const conversation = await repository.getConversationById(
      conversationId,
      businessId
    );
    if (!conversation) {
      throw boom.notFound("Conversation not found");
    }

    // Prepare note data
    const message = await repository.createMessage(conversationId, businessId, {
      content: noteData.content,
      content_type: "text",
      is_internal: true,
      sender_type: "business_user",
      sender_id: userId,
      metadata: {
        mentioned_users: noteData.mentioned_users || [],
      },
    });

    return { message };
  } catch (error) {
    logger.error(`Error in sendNote service for ${conversationId}:`, error);
    throw error.isBoom ? error : boom.badImplementation("Failed to send note");
  }
};

/**
 * Add a tag to a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} businessId - Business ID
 * @param {string} tagId - Tag ID
 * @param {string} userId - User ID adding the tag
 * @returns {Promise<Object>} Added tag
 */
const addTag = async (conversationId, businessId, tagId, userId) => {
  try {
    // Check if conversation exists
    const conversation = await repository.getConversationById(
      conversationId,
      businessId
    );
    if (!conversation) {
      throw boom.notFound("Conversation not found");
    }

    const tag = await repository.addTagToConversation(
      conversationId,
      businessId,
      tagId,
      userId
    );

    return { tag };
  } catch (error) {
    logger.error(`Error in addTag service for ${conversationId}:`, error);
    throw error.isBoom
      ? error
      : boom.badImplementation("Failed to add tag to conversation");
  }
};

/**
 * Remove a tag from a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} businessId - Business ID
 * @param {string} tagId - Tag ID
 * @returns {Promise<Object>} Success message
 */
const removeTag = async (conversationId, businessId, tagId) => {
  try {
    // Check if conversation exists
    const conversation = await repository.getConversationById(
      conversationId,
      businessId
    );
    if (!conversation) {
      throw boom.notFound("Conversation not found");
    }

    const success = await repository.removeTagFromConversation(
      conversationId,
      businessId,
      tagId
    );

    if (!success) {
      throw boom.notFound("Tag not found on this conversation");
    }

    return { message: "Tag removed successfully" };
  } catch (error) {
    logger.error(`Error in removeTag service for ${conversationId}:`, error);
    throw error.isBoom
      ? error
      : boom.badImplementation("Failed to remove tag from conversation");
  }
};

/**
 * Get conversation statistics
 * @param {string} businessId - Business ID
 * @param {Object} queryParams - Query parameters for filtering
 * @returns {Promise<Object>} Conversation statistics
 */
const getStatistics = async (businessId, queryParams) => {
  try {
    const { start_date, end_date, team_id } = queryParams;

    // Build filters object
    const filters = {
      start_date,
      end_date,
      team_id,
    };

    // Remove undefined filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const statistics = await repository.getConversationStatistics(
      businessId,
      filters
    );

    return statistics;
  } catch (error) {
    logger.error(
      `Error in getStatistics service for business ${businessId}:`,
      error
    );
    throw error.isBoom
      ? error
      : boom.badImplementation("Failed to get conversation statistics");
  }
};

/**
 * Create a new tag
 * @param {string} businessId - Business ID
 * @param {Object} tagData - Tag data
 * @param {string} userId - User ID creating the tag
 * @returns {Promise<Object>} Created tag
 */
const createTag = async (businessId, tagData, userId) => {
  try {
    const tag = await repository.createTag(businessId, {
      ...tagData,
      created_by: userId,
    });

    return { tag };
  } catch (error) {
    logger.error(
      `Error in createTag service for business ${businessId}:`,
      error
    );
    throw error.isBoom ? error : boom.badImplementation("Failed to create tag");
  }
};

/**
 * Get all tags for a business
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Array of tags
 */
const getTags = async (businessId) => {
  try {
    const tags = await repository.getTagsByBusinessId(businessId);

    return { tags };
  } catch (error) {
    logger.error(`Error in getTags service for business ${businessId}:`, error);
    throw error.isBoom ? error : boom.badImplementation("Failed to get tags");
  }
};

module.exports = {
  getConversations,
  getConversationDetails,
  updateStatus,
  assignConversation,
  sendMessage,
  sendNote,
  addTag,
  removeTag,
  getStatistics,
  createTag,
  getTags,
};
