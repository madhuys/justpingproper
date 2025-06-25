// api/TeamInbox/repository.js
const { transaction } = require("objection");
const Conversation = require("../../system/models/Conversation");
const Message = require("../../system/models/Message");
const Tag = require("../../system/models/Tag");
const logger = require("../../system/utils/logger");

/**
 * Find conversations with filtering and pagination
 * @param {string} businessId - Business ID
 * @param {Object} filters - Filter criteria
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} sortBy - Field to sort by
 * @param {string} sortDirection - Sort direction (asc/desc)
 * @returns {Promise<Object>} Paginated conversations
 */
const findConversations = async (
  businessId,
  filters = {},
  page = 1,
  limit = 20,
  sortBy = "last_message_at",
  sortDirection = "desc"
) => {
  try {
    const offset = (page - 1) * limit;

    // Build query
    const query = Conversation.query()
      .where("business_id", businessId)
      .withGraphFetched({
        endUser: true,
        businessChannel: true,
        assignedUser: true,
        assignedTeam: true,
        tags: true,
        messages: (builder) => {
          builder.orderBy("created_at", "desc").limit(1);
        },
      });

    // Apply filters
    if (filters.status) {
      query.where("status", filters.status);
    }

    if (filters.campaign_id) {
      query.whereExists(
        Conversation.relatedQuery("broadcast").whereExists(
          Broadcast.relatedQuery("campaign").where("id", filters.campaign_id)
        )
      );
    }

    if (filters.broadcast_id) {
      query.where("broadcast_id", filters.broadcast_id);
    }

    if (filters.assigned_to) {
      query.where("assigned_user_id", filters.assigned_to);
    }

    if (filters.assigned_team) {
      query.where("assigned_team_id", filters.assigned_team);
    }

    if (filters.search) {
      query.where((builder) => {
        builder
          .whereExists(
            Conversation.relatedQuery("endUser").where((subBuilder) => {
              subBuilder
                .whereRaw("LOWER(first_name) LIKE ?", [
                  `%${filters.search.toLowerCase()}%`,
                ])
                .orWhereRaw("LOWER(last_name) LIKE ?", [
                  `%${filters.search.toLowerCase()}%`,
                ])
                .orWhereRaw("LOWER(phone) LIKE ?", [
                  `%${filters.search.toLowerCase()}%`,
                ])
                .orWhereRaw("LOWER(email) LIKE ?", [
                  `%${filters.search.toLowerCase()}%`,
                ]);
            })
          )
          .orWhereExists(
            Conversation.relatedQuery("messages").whereRaw(
              "LOWER(content) LIKE ?",
              [`%${filters.search.toLowerCase()}%`]
            )
          );
      });
    }

    if (filters.timeframe) {
      const now = new Date();
      let startDate;

      switch (filters.timeframe) {
        case "24h":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        query.where("created_at", ">=", startDate.toISOString());
      }
    }

    // Count total before pagination
    const total = await query.clone().resultSize();

    // Apply sorting and pagination
    query.orderBy(sortBy, sortDirection).limit(limit).offset(offset);

    // Execute query
    const conversations = await query;

    return {
      conversations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(
      `Error finding conversations for business ${businessId}:`,
      error
    );
    throw error;
  }
};

/**
 * Get conversation by ID with message history
 * @param {string} conversationId - Conversation ID
 * @param {string} businessId - Business ID
 * @param {number} page - Page number for messages
 * @param {number} limit - Messages per page
 * @returns {Promise<Object>} Conversation with messages
 */
const getConversationById = async (
  conversationId,
  businessId,
  page = 1,
  limit = 50
) => {
  try {
    const offset = (page - 1) * limit;

    // Get conversation with related data
    const conversation = await Conversation.query()
      .findById(conversationId)
      .where("business_id", businessId)
      .withGraphFetched({
        endUser: true,
        businessChannel: true,
        assignedUser: true,
        assignedTeam: true,
        broadcast: true,
        tags: true,
      });

    if (!conversation) {
      return null;
    }

    // Get messages with pagination
    const messagesQuery = Message.query()
      .where("conversation_id", conversationId)
      .withGraphFetched("attachments")
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);

    const messages = await messagesQuery;

    // Count total messages
    const totalMessages = await Message.query()
      .where("conversation_id", conversationId)
      .resultSize();

    // Add messages and pagination to conversation
    conversation.messages = messages;
    conversation.pagination = {
      total: totalMessages,
      page,
      limit,
      pages: Math.ceil(totalMessages / limit),
    };

    return conversation;
  } catch (error) {
    logger.error(`Error getting conversation ${conversationId}:`, error);
    throw error;
  }
};

/**
 * Update conversation status
 * @param {string} conversationId - Conversation ID
 * @param {string} businessId - Business ID
 * @param {string} status - New status
 * @param {string} userId - User ID making the change
 * @returns {Promise<Object>} Updated conversation
 */
const updateConversationStatus = async (
  conversationId,
  businessId,
  status,
  userId
) => {
  try {
    const now = new Date().toISOString();
    const updateData = {
      status,
      updated_at: now,
      updated_by: userId,
    };

    // Add status-specific timestamps
    if (status === "closed") {
      updateData.closed_at = now;
    } else if (status === "active" && status !== "pending") {
      // If reopening a conversation, clear closed_at
      updateData.closed_at = null;
    }

    const updatedConversation = await Conversation.query()
      .patchAndFetchById(conversationId, updateData)
      .where("business_id", businessId);

    return updatedConversation;
  } catch (error) {
    logger.error(
      `Error updating conversation ${conversationId} status:`,
      error
    );
    throw error;
  }
};

/**
 * Assign conversation to user and/or team
 * @param {string} conversationId - Conversation ID
 * @param {string} businessId - Business ID
 * @param {string} assignedUserId - User ID to assign to (optional)
 * @param {string} assignedTeamId - Team ID to assign to (optional)
 * @param {string} updatedBy - User ID making the change
 * @returns {Promise<Object>} Updated conversation
 */
const assignConversation = async (
  conversationId,
  businessId,
  assignedUserId,
  assignedTeamId,
  updatedBy
) => {
  try {
    const updateData = {
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    };

    if (assignedUserId !== undefined) {
      updateData.assigned_user_id = assignedUserId;
    }

    if (assignedTeamId !== undefined) {
      updateData.assigned_team_id = assignedTeamId;
    }

    const updatedConversation = await Conversation.query()
      .patchAndFetchById(conversationId, updateData)
      .where("business_id", businessId)
      .withGraphFetched({
        assignedUser: true,
        assignedTeam: true,
      });

    return updatedConversation;
  } catch (error) {
    logger.error(`Error assigning conversation ${conversationId}:`, error);
    throw error;
  }
};

/**
 * Create a new message in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} businessId - Business ID
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} Created message
 */
const createMessage = async (conversationId, businessId, messageData) => {
  try {
    const now = new Date().toISOString();

    // Start a transaction
    return await transaction(Message.knex(), async (trx) => {
      // First, verify the conversation exists and belongs to the business
      const conversation = await Conversation.query(trx)
        .findById(conversationId)
        .where("business_id", businessId);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Create the message
      const message = await Message.query(trx).insert({
        ...messageData,
        conversation_id: conversationId,
        created_at: now,
      });

      // Update conversation with last_message_at
      await Conversation.query(trx).patchAndFetchById(conversationId, {
        last_message_at: now,
        updated_at: now,
      });

      // If this is a business user message and there's no first_response_at,
      // update it (only for non-internal messages)
      if (
        messageData.sender_type === "business_user" &&
        !conversation.first_response_at &&
        !messageData.is_internal
      ) {
        await Conversation.query(trx).patchAndFetchById(conversationId, {
          first_response_at: now,
        });
      }

      return message;
    });
  } catch (error) {
    logger.error(
      `Error creating message in conversation ${conversationId}:`,
      error
    );
    throw error;
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
const addTagToConversation = async (
  conversationId,
  businessId,
  tagId,
  userId
) => {
  try {
    // Start a transaction
    return await transaction(Tag.knex(), async (trx) => {
      // First, verify the conversation exists and belongs to the business
      const conversation = await Conversation.query(trx)
        .findById(conversationId)
        .where("business_id", businessId);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Verify the tag exists and belongs to the business
      const tag = await Tag.query(trx)
        .findById(tagId)
        .where("business_id", businessId);

      if (!tag) {
        throw new Error("Tag not found");
      }

      // Check if the tag is already applied to the conversation
      const existingRelation = await Conversation.relatedQuery("tags", trx)
        .for(conversationId)
        .where("id", tagId);

      if (existingRelation.length > 0) {
        return tag; // Tag already exists, just return it
      }

      // Add the tag to the conversation
      await Conversation.relatedQuery("tags", trx).for(conversationId).relate({
        id: tagId,
        created_by: userId,
        created_at: new Date().toISOString(),
      });

      return tag;
    });
  } catch (error) {
    logger.error(
      `Error adding tag ${tagId} to conversation ${conversationId}:`,
      error
    );
    throw error;
  }
};

/**
 * Remove a tag from a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} businessId - Business ID
 * @param {string} tagId - Tag ID
 * @returns {Promise<boolean>} Success status
 */
const removeTagFromConversation = async (conversationId, businessId, tagId) => {
  try {
    // Start a transaction
    return await transaction(Tag.knex(), async (trx) => {
      // First, verify the conversation exists and belongs to the business
      const conversation = await Conversation.query(trx)
        .findById(conversationId)
        .where("business_id", businessId);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Verify the tag exists and belongs to the business
      const tag = await Tag.query(trx)
        .findById(tagId)
        .where("business_id", businessId);

      if (!tag) {
        throw new Error("Tag not found");
      }

      // Remove the tag from the conversation
      const numDeleted = await Conversation.relatedQuery("tags", trx)
        .for(conversationId)
        .unrelate()
        .where("id", tagId);

      return numDeleted > 0;
    });
  } catch (error) {
    logger.error(
      `Error removing tag ${tagId} from conversation ${conversationId}:`,
      error
    );
    throw error;
  }
};

/**
 * Get conversation statistics
 * @param {string} businessId - Business ID
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Object>} Conversation statistics
 */
const getConversationStatistics = async (businessId, filters = {}) => {
  try {
    // Base query for all statistics
    const baseQuery = Conversation.query().where("business_id", businessId);

    // Apply date filters if provided
    if (filters.start_date) {
      baseQuery.where("created_at", ">=", `${filters.start_date}T00:00:00Z`);
    }

    if (filters.end_date) {
      baseQuery.where("created_at", "<=", `${filters.end_date}T23:59:59Z`);
    }

    // Apply team filter if provided
    if (filters.team_id) {
      baseQuery.where("assigned_team_id", filters.team_id);
    }

    // Get total conversations
    const totalConversations = await baseQuery.clone().resultSize();

    // Get conversations by status
    const activeConversations = await baseQuery
      .clone()
      .where("status", "active")
      .resultSize();

    const pendingConversations = await baseQuery
      .clone()
      .where("status", "pending")
      .resultSize();

    const closedConversations = await baseQuery
      .clone()
      .where("status", "closed")
      .resultSize();

    // Get average resolution time (for closed conversations)
    const resolutionTimeQuery = await baseQuery
      .clone()
      .where("status", "closed")
      .whereNotNull("closed_at")
      .whereNotNull("created_at")
      .select(
        Conversation.knex().raw(
          "AVG(EXTRACT(EPOCH FROM (closed_at - created_at))) as avg_resolution_time"
        )
      );

    const avgResolutionTimeSeconds =
      resolutionTimeQuery[0]?.avg_resolution_time || 0;

    // Get average first response time
    const responseTimeQuery = await baseQuery
      .clone()
      .whereNotNull("first_response_at")
      .whereNotNull("created_at")
      .select(
        Conversation.knex().raw(
          "AVG(EXTRACT(EPOCH FROM (first_response_at - created_at))) as avg_response_time"
        )
      );

    const avgResponseTimeSeconds = responseTimeQuery[0]?.avg_response_time || 0;

    // Format times as human-readable strings
    const formatTime = (seconds) => {
      if (seconds === 0) return "0s";

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = Math.floor(seconds % 60);

      let result = "";
      if (hours > 0) result += `${hours}h `;
      if (minutes > 0) result += `${minutes}m `;
      if (remainingSeconds > 0) result += `${remainingSeconds}s`;

      return result.trim();
    };

    // Get conversations by channel
    const conversationsByChannel = await baseQuery
      .clone()
      .select(
        "business_channel.name as channel_name",
        Conversation.knex().raw("COUNT(*) as count")
      )
      .join(
        "business_channel",
        "conversation.business_channel_id",
        "business_channel.id"
      )
      .groupBy("business_channel.name");

    // Format channel data
    const conversationByChannel = {};
    conversationsByChannel.forEach((item) => {
      conversationByChannel[item.channel_name] = parseInt(item.count);
    });

    // Get conversations by day (for the last 7 days or filtered date range)
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    if (filters.start_date) {
      startDate = new Date(filters.start_date);
    }

    let endDate = new Date();
    if (filters.end_date) {
      endDate = new Date(filters.end_date);
    }

    const conversationsByDay = await baseQuery
      .clone()
      .select(
        Conversation.knex().raw("DATE(created_at) as date, COUNT(*) as count")
      )
      .where("created_at", ">=", startDate.toISOString())
      .where("created_at", "<=", endDate.toISOString())
      .groupBy("date")
      .orderBy("date");

    // Format day data
    const conversationByDay = {};
    conversationsByDay.forEach((item) => {
      const dateStr = item.date.toISOString().split("T")[0];
      conversationByDay[dateStr] = parseInt(item.count);
    });

    return {
      total_conversations: totalConversations,
      active_conversations: activeConversations,
      pending_conversations: pendingConversations,
      closed_conversations: closedConversations,
      average_resolution_time: formatTime(avgResolutionTimeSeconds),
      average_first_response_time: formatTime(avgResponseTimeSeconds),
      conversation_by_channel: conversationByChannel,
      conversation_by_status: {
        active: activeConversations,
        pending: pendingConversations,
        closed: closedConversations,
      },
      conversation_by_day: conversationByDay,
    };
  } catch (error) {
    logger.error(
      `Error getting conversation statistics for business ${businessId}:`,
      error
    );
    throw error;
  }
};

/**
 * Create a new tag
 * @param {string} businessId - Business ID
 * @param {Object} tagData - Tag data
 * @returns {Promise<Object>} Created tag
 */
const createTag = async (businessId, tagData) => {
  try {
    const tag = await Tag.query().insert({
      ...tagData,
      business_id: businessId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return tag;
  } catch (error) {
    logger.error(`Error creating tag for business ${businessId}:`, error);
    throw error;
  }
};

/**
 * Get all tags for a business
 * @param {string} businessId - Business ID
 * @returns {Promise<Array>} Array of tags
 */
const getTagsByBusinessId = async (businessId) => {
  try {
    const tags = await Tag.query()
      .where("business_id", businessId)
      .orderBy("name");

    return tags;
  } catch (error) {
    logger.error(`Error getting tags for business ${businessId}:`, error);
    throw error;
  }
};

module.exports = {
  findConversations,
  getConversationById,
  updateConversationStatus,
  assignConversation,
  createMessage,
  addTagToConversation,
  removeTagFromConversation,
  getConversationStatistics,
  createTag,
  getTagsByBusinessId,
};
