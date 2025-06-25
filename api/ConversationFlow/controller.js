// api/ConversationFlow/controller.js
const boom = require("@hapi/boom");
const logger = require("../../system/utils/logger");
const {
  getConversationSummary,
  resetConversationToStep,
  getAgentFlowDefinition,
  validateAgentFlow,
  getConversationPerformanceMetrics,
  exportConversationData,
} = require("../../AgentsFlow/utils");
const { generateConversationAnalytics } = require("../../AgentsFlow/analytics");
const Conversation = require("../../system/models/Conversation");

/**
 * Get conversation details and progress
 * @param {Object} req - Express request
 * @returns {Promise<Object>} - Response object
 */
module.exports.getConversation = async (req) => {
  try {
    const { conversationId } = req.params;

    // Get conversation summary and details
    const conversationData = await getConversationSummary(conversationId);

    // Get performance metrics if available
    let performanceMetrics = null;
    try {
      performanceMetrics = await getConversationPerformanceMetrics(
        conversationId,
      );
    } catch (metricsError) {
      logger.warn(
        `Could not fetch performance metrics for conversation ${conversationId}:`,
        metricsError.message,
      );
    }

    // Get analytics data
    let analytics = null;
    try {
      analytics = await generateConversationAnalytics([conversationId]);
    } catch (analyticsError) {
      logger.warn(
        `Could not fetch analytics for conversation ${conversationId}:`,
        analyticsError.message,
      );
    }

    return {
      success: true,
      data: {
        conversation: conversationData,
        performanceMetrics,
        analytics: analytics?.conversations?.[0] || null,
      },
    };
  } catch (error) {
    logger.error("Error getting conversation:", error);

    // Check if it's a "not found" error
    if (error.message && error.message.includes("not found")) {
      throw boom.notFound(
        `Conversation ${req.params.conversationId} not found`,
      );
    }

    throw boom.badImplementation("Failed to get conversation");
  }
};

/**
 * Reset conversation to a specific step
 * @param {Object} req - Express request
 * @returns {Promise<Object>} - Response object
 */
module.exports.resetConversation = async (req) => {
  try {
    const { conversationId } = req.params;
    const {
      step = "step0",
      clearVariables = false,
      reason = "manual_reset",
    } = req.body;

    const updatedConversation = await resetConversationToStep(
      conversationId,
      step,
      {
        clearVariables,
        reason,
      },
    );

    return {
      success: true,
      message: `Conversation reset to ${step}`,
      data: {
        id: updatedConversation.id,
        currentStep: updatedConversation.current_step,
        status: updatedConversation.status,
      },
    };
  } catch (error) {
    logger.error("Error resetting conversation:", error);
    throw boom.badImplementation("Failed to reset conversation");
  }
};

/**
 * Get agent flow definition and structure
 * @param {Object} req - Express request
 * @returns {Promise<Object>} - Response object
 */
module.exports.getAgentFlow = async (req) => {
  try {
    const { agentId } = req.params;
    const flowDefinition = await getAgentFlowDefinition(agentId);

    return {
      success: true,
      data: flowDefinition,
    };
  } catch (error) {
    logger.error("Error getting agent flow:", error);
    if (error.message.includes("not found")) {
      throw boom.notFound(error.message);
    }
    throw boom.badImplementation("Failed to get agent flow");
  }
};

/**
 * Validate agent flow configuration
 * @param {Object} req - Express request
 * @returns {Promise<Object>} - Response object
 */
module.exports.validateFlow = async (req) => {
  try {
    const { agentId } = req.params;
    const validation = await validateAgentFlow(agentId);

    return {
      success: true,
      data: validation,
    };
  } catch (error) {
    logger.error("Error validating agent flow:", error);
    throw boom.badImplementation("Failed to validate agent flow");
  }
};

/**
 * Get conversation analytics and metrics
 * @param {Object} req - Express request
 * @returns {Promise<Object>} - Response object
 */
module.exports.getAnalytics = async (req) => {
  try {
    const {
      startDate,
      endDate,
      agentId,
      businessChannelId,
      status,
      includePerformance = false,
    } = req.query;

    let analytics;

    if (includePerformance === "true") {
      analytics = await getConversationPerformanceMetrics({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        agentId,
        businessChannelId,
      });
    } else {
      analytics = await generateConversationAnalytics({
        startDate,
        endDate,
        agentId,
        businessChannelId,
        status,
      });
    }

    return {
      success: true,
      data: analytics,
    };
  } catch (error) {
    logger.error("Error getting analytics:", error);
    throw boom.badImplementation("Failed to get analytics");
  }
};

/**
 * Export conversation data
 * @param {Object} req - Express request
 * @returns {Promise<Object>} - Response object
 */
module.exports.exportData = async (req) => {
  try {
    const {
      startDate,
      endDate,
      agentId,
      businessChannelId,
      status,
      format = "json",
      includeAnalytics = true,
    } = req.query;

    const data = await exportConversationData({
      startDate,
      endDate,
      agentId,
      businessChannelId,
      status,
      includeAnalytics: includeAnalytics === "true",
    });

    // Note: CSV export functionality would need to be handled at route level
    // or with custom response handling in controllerHandler
    return {
      success: true,
      data,
      meta: {
        total: data.length,
        exportedAt: new Date().toISOString(),
        filters: { startDate, endDate, agentId, businessChannelId, status },
        requestedFormat: format,
      },
    };
  } catch (error) {
    logger.error("Error exporting data:", error);
    throw boom.badImplementation("Failed to export data");
  }
};

/**
 * Get conversation flow health dashboard
 * @param {Object} req - Express request
 * @returns {Promise<Object>} - Response object
 */
module.exports.getHealthDashboard = async (req) => {
  try {
    const { businessId } = req.user;
    const { period = "7d" } = req.query;

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case "1d":
        startDate.setDate(endDate.getDate() - 1);
        break;
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    const metrics = await getConversationPerformanceMetrics({
      startDate,
      endDate,
    });

    // Get system health indicators
    const healthData = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      overview: {
        totalConversations: metrics.total_conversations,
        completionRate: metrics.completion_rate,
        averageSteps: metrics.average_steps_per_conversation,
        dailyAverage: metrics.dailyAverages.conversations,
      },
      health: metrics.healthIndicators,
      recommendations: metrics.recommendations,
      trends: {
        // Could add trend calculations here
        conversationGrowth: 0,
        completionTrend: 0,
      },
    };

    return {
      success: true,
      data: healthData,
    };
  } catch (error) {
    logger.error("Error getting health dashboard:", error);
    throw boom.badImplementation("Failed to get health dashboard");
  }
};

/**
 * Get conversations by broadcast ID
 * @param {Object} req - Express request
 * @returns {Promise<Object>} - Response object
 */
module.exports.getConversationsByBroadcastId = async (req) => {
  try {
    const { broadcastId } = req.params;
    const { businessId } = req.user;
    const { page = 1, limit = 20, status } = req.query;

    // Build query
    let query = Conversation.query()
      .where("broadcast_id", broadcastId)
      .where("business_id", businessId)
      .withGraphFetched({
        endUser: true,
        businessChannel: true,
        assignedUser: true,
        assignedTeam: true,
        broadcast: true,
        agent: true,
      })
      .orderBy("created_at", "desc");

    // Filter by status if provided
    if (status) {
      query = query.where("status", status);
    }

    // Apply pagination
    const result = await query.page(page - 1, limit);

    return {
      success: true,
      data: {
        conversations: result.results,
        pagination: {
          total: result.total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(result.total / limit),
        },
      },
    };
  } catch (error) {
    logger.error("Error getting conversations by broadcast ID:", error);
    throw boom.badImplementation("Failed to get conversations by broadcast ID");
  }
};

/**
 * Get conversations by status
 * @param {Object} req - Express request
 * @returns {Promise<Object>} - Response object
 */
module.exports.getConversationsByStatus = async (req) => {
  try {
    const { status } = req.params;
    const { businessId } = req.user;
    const {
      page = 1,
      limit = 20,
      broadcastId,
      agentId,
      businessChannelId,
      startDate,
      endDate,
    } = req.query;

    // Build query
    let query = Conversation.query()
      .where("status", status)
      .where("business_id", businessId)
      .withGraphFetched({
        endUser: true,
        businessChannel: true,
        assignedUser: true,
        assignedTeam: true,
        broadcast: true,
        agent: true,
      })
      .orderBy("created_at", "desc");

    // Apply additional filters
    if (broadcastId) {
      query = query.where("broadcast_id", broadcastId);
    }

    if (agentId) {
      query = query.where("agent_id", agentId);
    }

    if (businessChannelId) {
      query = query.where("business_channel_id", businessChannelId);
    }

    if (startDate) {
      query = query.where(
        "created_at",
        ">=",
        new Date(startDate).toISOString(),
      );
    }

    if (endDate) {
      query = query.where("created_at", "<=", new Date(endDate).toISOString());
    }

    // Apply pagination
    const result = await query.page(page - 1, limit);

    return {
      success: true,
      data: {
        conversations: result.results,
        pagination: {
          total: result.total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(result.total / limit),
        },
        filters: {
          status,
          broadcastId,
          agentId,
          businessChannelId,
          startDate,
          endDate,
        },
      },
    };
  } catch (error) {
    logger.error("Error getting conversations by status:", error);
    throw boom.badImplementation("Failed to get conversations by status");
  }
};

/**
 * Get single conversation by ID with detailed information
 * @param {Object} req - Express request
 * @returns {Promise<Object>} - Response object
 */
module.exports.getConversationById = async (req) => {
  try {
    const { conversationId } = req.params;
    const { businessId } = req.user;
    const { includeMessages = false, messageLimit = 50 } = req.query;

    // Get conversation with relationships
    const conversation = await Conversation.query()
      .findById(conversationId)
      .where("business_id", businessId)
      .withGraphFetched({
        endUser: true,
        businessChannel: true,
        assignedUser: true,
        assignedTeam: true,
        broadcast: true,
        agent: true,
        tags: true,
      });

    if (!conversation) {
      throw boom.notFound("Conversation not found");
    }

    // Optionally include messages
    if (includeMessages === "true") {
      const Message = require("../../system/models/Message");
      const messages = await Message.query()
        .where("conversation_id", conversationId)
        .withGraphFetched("attachments")
        .orderBy("created_at", "desc")
        .limit(parseInt(messageLimit));

      conversation.messages = messages;
    }

    // Get conversation analytics if available
    const analytics = conversation.metadata?.analytics || {};

    return {
      success: true,
      data: {
        ...conversation,
        analytics: {
          totalMessages: analytics.total_messages || 0,
          responseTime: analytics.average_response_time || 0,
          lastActivity: conversation.last_message_at,
          duration:
            conversation.created_at && conversation.closed_at
              ? new Date(conversation.closed_at) -
                new Date(conversation.created_at)
              : null,
        },
      },
    };
  } catch (error) {
    logger.error("Error getting conversation by ID:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get conversation by ID");
  }
};

/**
 * Get agent keywords and IDs from broadcast data using conversation data
 * @param {Object} req - Express request
 * @returns {Promise<Object>} - Response object
 */
module.exports.getAgentMappingFromBroadcast = async (req) => {
  try {
    const { conversationId } = req.params;

    logger.info("Getting agent mapping from broadcast for conversation:", {
      conversationId,
    });

    // Get conversation details
    const conversation = await Conversation.query()
      .select("id", "metadata", "broadcast_id")
      .where("id", conversationId)
      .first();

    if (!conversation) {
      throw boom.notFound("Conversation not found");
    }

    // Extract broadcast_id from conversation metadata or direct field
    const broadcastId =
      conversation.broadcast_id || conversation.metadata?.broadcast_id;

    if (!broadcastId) {
      throw boom.badRequest("No broadcast_id found in conversation data");
    }

    logger.info("Found broadcast_id in conversation:", {
      broadcastId,
      conversationId,
    });

    // Get broadcast details with agent mapping
    const Broadcast = require("../../system/models/Broadcast");
    const broadcast = await Broadcast.query()
      .select("id", "name", "agent_mapping", "metadata", "type")
      .where("id", broadcastId)
      .first();

    if (!broadcast) {
      throw boom.notFound("Broadcast not found");
    }

    const agentMapping = broadcast.agent_mapping || {};

    logger.info("Retrieved broadcast agent mapping:", {
      broadcastId,
      broadcastName: broadcast.name,
      broadcastType: broadcast.type,
      agentMappingKeys: Object.keys(agentMapping),
      agentMappingCount: Object.keys(agentMapping).length,
    });

    // Extract agent keywords (keys) and agent IDs (values)
    const keywords = Object.keys(agentMapping);
    const agentIds = Object.values(agentMapping);
    const uniqueAgentIds = [...new Set(agentIds)];

    // Get agent details for the mapped agents
    const Agent = require("../../system/models/Agent");
    const agents = await Agent.query()
      .select("id", "name", "description", "status")
      .whereIn("id", uniqueAgentIds)
      .where("status", "active");

    // Create a structured response
    const agentMappingDetails = Object.entries(agentMapping).map(
      ([keyword, agentId]) => {
        const agent = agents.find((a) => a.id === agentId);
        return {
          keyword,
          agentId,
          agent: agent
            ? {
                id: agent.id,
                name: agent.name,
                description: agent.description,
                status: agent.status,
              }
            : null,
        };
      },
    );

    const result = {
      conversationId,
      broadcastId,
      broadcast: {
        id: broadcast.id,
        name: broadcast.name,
        type: broadcast.type,
      },
      agentMapping: {
        raw: agentMapping,
        details: agentMappingDetails,
        keywords,
        agentIds: uniqueAgentIds,
        totalMappings: keywords.length,
        totalUniqueAgents: uniqueAgentIds.length,
      },
      availableAgents: agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
      })),
    };
    logger.info("Successfully extracted agent mapping from broadcast:", {
      conversationId,
      broadcastId,
      totalKeywords: keywords.length,
      totalAgents: uniqueAgentIds.length,
      availableAgents: agents.length,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("Error getting agent mapping from broadcast:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get agent mapping from broadcast");
  }
};

/**
 * Find specific agent by ID from broadcast data (strict mode for outbound broadcasts)
 * @param {Object} req - Express request
 * @returns {Promise<Object>} - Response object
 */
module.exports.findAgentFromBroadcast = async (req) => {
  try {
    const { conversationId, agentId } = req.params;

    logger.info("Finding agent from broadcast for conversation:", {
      conversationId,
      agentId,
    });

    // Get conversation details
    const conversation = await Conversation.query()
      .select("id", "metadata", "broadcast_id", "status", "current_step")
      .where("id", conversationId)
      .first();

    if (!conversation) {
      throw boom.notFound("Conversation not found");
    }

    // Extract broadcast_id from conversation metadata or direct field
    const broadcastId =
      conversation.broadcast_id || conversation.metadata?.broadcast_id;

    if (!broadcastId) {
      throw boom.badRequest("No broadcast_id found in conversation data");
    }

    logger.info("Found broadcast_id in conversation:", {
      broadcastId,
      conversationId,
    });

    // Get broadcast details with agent mapping
    const Broadcast = require("../../system/models/Broadcast");
    const broadcast = await Broadcast.query()
      .select("id", "name", "agent_mapping", "metadata", "type")
      .where("id", broadcastId)
      .first();

    if (!broadcast) {
      throw boom.notFound("Broadcast not found");
    }

    const agentMapping = broadcast.agent_mapping || {};
    const broadcastType = broadcast.type;

    logger.info("Retrieved broadcast details:", {
      broadcastId,
      broadcastName: broadcast.name,
      broadcastType,
      agentMappingKeys: Object.keys(agentMapping),
      requestedAgentId: agentId,
    });

    // STRICT MODE: For outbound broadcasts, only find agents from broadcast mapping
    if (broadcastType === "outbound") {
      logger.info(
        "Applying STRICT mode for outbound broadcast - checking agent mapping only",
      );

      // Check if the requested agent ID exists in broadcast mapping
      const mappedAgentIds = Object.values(agentMapping);
      const isAgentInBroadcastMapping = mappedAgentIds.includes(agentId);

      if (!isAgentInBroadcastMapping) {
        logger.warn("Agent not found in broadcast mapping:", {
          requestedAgentId: agentId,
          availableAgentIds: mappedAgentIds,
          broadcastType,
        });

        return res.json({
          success: false,
          error: "Agent not available for this broadcast",
          data: {
            conversationId,
            broadcastId,
            requestedAgentId: agentId,
            broadcastType,
            availableAgentIds: mappedAgentIds,
            message:
              "For outbound broadcasts, agents can only be triggered from broadcast mapping data",
          },
        });
      }

      // Find which keyword(s) map to this agent
      const agentKeywords = Object.entries(agentMapping)
        .filter(([keyword, mappedAgentId]) => mappedAgentId === agentId)
        .map(([keyword]) => keyword);

      logger.info("Agent found in broadcast mapping:", {
        agentId,
        keywords: agentKeywords,
        broadcastType,
      });

      // Get agent details (only if it exists in broadcast mapping)
      const Agent = require("../../system/models/Agent");
      const agent = await Agent.query()
        .select("id", "name", "description", "status", "metadata")
        .where("id", agentId)
        .where("status", "active")
        .first();

      if (!agent) {
        logger.warn(
          "Agent exists in broadcast mapping but not found in agent table or inactive:",
          {
            agentId,
            broadcastType,
          },
        );

        return res.json({
          success: false,
          error: "Agent not found or inactive",
          data: {
            conversationId,
            broadcastId,
            requestedAgentId: agentId,
            broadcastType,
            keywords: agentKeywords,
            message:
              "Agent exists in broadcast mapping but is not active or not found",
          },
        });
      }

      // Success - agent found and validated for outbound broadcast
      const result = {
        conversationId,
        broadcastId,
        broadcast: {
          id: broadcast.id,
          name: broadcast.name,
          type: broadcast.type,
        },
        agent: {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          status: agent.status,
          metadata: agent.metadata,
        },
        mappingDetails: {
          keywords: agentKeywords,
          isValidForBroadcast: true,
          broadcastType,
          validationMode: "strict_broadcast_mapping",
        },
        conversation: {
          id: conversation.id,
          status: conversation.status,
          currentStep: conversation.current_step,
        },
      };

      logger.info(
        "Successfully found agent from broadcast mapping (strict mode):",
        {
          conversationId,
          agentId,
          agentName: agent.name,
          keywords: agentKeywords,
          broadcastType,
        },
      );

      return res.json({
        success: true,
        data: result,
      });
    } else {
      // For inbound broadcasts or other types, use regular agent lookup
      logger.info("Using regular mode for non-outbound broadcast");

      const Agent = require("../../system/models/Agent");
      const agent = await Agent.query()
        .select("id", "name", "description", "status", "metadata")
        .where("id", agentId)
        .where("status", "active")
        .first();
      if (!agent) {
        return {
          success: false,
          error: "Agent not found or inactive",
          data: {
            conversationId,
            broadcastId,
            requestedAgentId: agentId,
            broadcastType,
            message: "Agent not found in agent table or inactive",
          },
        };
      }

      // Check if agent is also in broadcast mapping (informational)
      const mappedAgentIds = Object.values(agentMapping);
      const isInBroadcastMapping = mappedAgentIds.includes(agentId);
      const agentKeywords = isInBroadcastMapping
        ? Object.entries(agentMapping)
            .filter(([keyword, mappedAgentId]) => mappedAgentId === agentId)
            .map(([keyword]) => keyword)
        : [];

      const result = {
        conversationId,
        broadcastId,
        broadcast: {
          id: broadcast.id,
          name: broadcast.name,
          type: broadcast.type,
        },
        agent: {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          status: agent.status,
          metadata: agent.metadata,
        },
        mappingDetails: {
          keywords: agentKeywords,
          isValidForBroadcast: true,
          isInBroadcastMapping,
          broadcastType,
          validationMode: "regular_agent_lookup",
        },
        conversation: {
          id: conversation.id,
          status: conversation.status,
          currentStep: conversation.current_step,
        },
      };
      logger.info("Successfully found agent using regular lookup:", {
        conversationId,
        agentId,
        agentName: agent.name,
        isInBroadcastMapping,
        broadcastType,
      });

      return {
        success: true,
        data: result,
      };
    }
  } catch (error) {
    logger.error("Error finding agent from broadcast:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to find agent from broadcast");
  }
};

/**
 * Find agent using keyword fallback logic for broadcast conversations
 * @param {Object} req - Express request
 * @returns {Promise<Object>} - Response object
 */
module.exports.findAgentWithKeywordFallback = async (req) => {
  try {
    const { conversationId } = req.params;
    const { userInput } = req.body;

    logger.info("Finding agent with keyword fallback for conversation:", {
      conversationId,
      userInput,
    });

    // Import the fallback function
    const {
      findAgentWithKeywordFallback,
    } = require("../../AgentsFlow/strictAgentValidator");

    // Use the keyword fallback logic
    const result = await findAgentWithKeywordFallback(
      conversationId,
      userInput,
    );

    if (!result.success) {
      logger.warn("Keyword fallback agent finding failed:", {
        conversationId,
        userInput,
        error: result.error,
        code: result.code,
      });

      return res.json({
        success: false,
        error: result.error,
        data: {
          conversationId,
          userInput,
          errorCode: result.code,
          details: result.details,
        },
      });
    }

    // Success response with detailed match information
    const responseData = {
      conversationId,
      userInput,
      broadcast: result.broadcast,
      agent: {
        id: result.agent.id,
        name: result.agent.name,
        description: result.agent.description,
        status: result.agent.status,
      },
      matchDetails: {
        keyword: result.matchDetails.keyword,
        matchType: result.matchDetails.matchType,
        isExactMatch: result.matchDetails.isExactMatch,
        isPartialMatch: result.matchDetails.isPartialMatch,
        isFallback: result.matchDetails.isFallback,
        allAvailableKeywords: result.matchDetails.allAvailableKeywords,
        validationMode: result.matchDetails.validationMode,
      },
    };
    logger.info("Successfully found agent with keyword fallback:", {
      conversationId,
      agentId: result.agent.id,
      agentName: result.agent.name,
      matchType: result.matchDetails.matchType,
      matchedKeyword: result.matchDetails.keyword,
      isFallback: result.matchDetails.isFallback,
    });

    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    logger.error("Error in keyword fallback agent finding:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to find agent with keyword fallback");
  }
};

/**
 * Helper function to convert data to CSV
 * @param {Array} data - Data array
 * @returns {string} - CSV string
 */
function convertToCSV(data) {
  if (!data || data.length === 0) {
    return "";
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      if (typeof value === "object" && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}
