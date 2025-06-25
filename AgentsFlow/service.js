// api/AgentsFlow/service.js
const boom = require("@hapi/boom");
const logger = require("../system/utils/logger");
const Agent = require("../system/models/Agent");
const BusinessChannel = require("../system/models/BusinessChannel");
const EndUser = require("../system/models/EndUser");
const Conversation = require("../system/models/Conversation");
const Message = require("../system/models/Message");
const AgentNode = require("../system/models/AgentNode");
const { getNodesByAgentAndStep } = require("../api/Agents/service");
const { validateUserResponse } = require("./helper");
const {
  updateConversationStep,
  getNextStepNode,
  generateStepResponse,
  generateRetryResponse,
  getConversationVariables,
} = require("./conversationFlowService");
const { handleCompleteConversationFlow } = require("./flowManager");
const {
  normalizePhoneNumber,
  createPhoneQueryVariations,
} = require("../system/utils/phoneNormalization");

/**
 * Find agent by business channel and message content
 * @param {string} businessChannelId - Business channel ID
 * @param {string} messageText - Message text to match against keywords
 * @returns {Promise<Object|null>} - Agent or null if not found
 */
async function findAgentForMessage(businessChannelId, messageText) {
  try {
    logger.info("Finding agent for message:", {
      businessChannelId,
      messageText,
    });

    // Get business ID from channel
    const channel = await BusinessChannel.query()
      .where("id", businessChannelId)
      .first();

    if (!channel) {
      logger.warn("Business channel not found:", businessChannelId);
      return null;
    }

    logger.info("Found business channel:", {
      channelId: channel.id,
      businessId: channel.business_id,
    });

    // Find agents for this business (removed is_active: true requirement)
    const agents = await Agent.query()
      .where({
        business_id: channel.business_id,
        status: "approved",
      })
      .modify("notDeleted");

    logger.info("Found agents:", {
      count: agents.length,
      agentIds: agents.map((a) => a.id),
      agentNames: agents.map((a) => a.name),
    });

    if (!agents.length) {
      logger.warn(
        "No approved agents found for business:",
        channel.business_id,
      );
      return null;
    }

    // Check for keyword matches
    const lowerCaseText = messageText.toLowerCase();
    logger.info("Checking keywords for message:", lowerCaseText);

    for (const agent of agents) {
      logger.info("Checking agent keywords:", {
        agentId: agent.id,
        agentName: agent.name,
        keywords: agent.key_words,
        isActive: agent.is_active,
      });

      if (agent.key_words && Array.isArray(agent.key_words)) {
        const hasKeywordMatch = agent.key_words.some((keyword) => {
          const match = lowerCaseText.includes(keyword.toLowerCase());
          logger.info("Keyword match check:", {
            keyword,
            messageText: lowerCaseText,
            match,
          });
          return match;
        });

        if (hasKeywordMatch) {
          logger.info("Found matching agent:", {
            agentId: agent.id,
            agentName: agent.name,
          });
          return agent;
        }
      }
    }

    // Return first approved agent if no keyword match
    logger.info("No keyword match found, returning first agent:", {
      agentId: agents[0].id,
      agentName: agents[0].agent_name,
    });
    return agents[0];
  } catch (error) {
    logger.error("Error finding agent for message:", error);
    throw error; // Throw error instead of returning it
  }
}

/**
 * Get user data from end user
 * @param {string} end_user_id - End user ID
 * @returns {Promise<Object>} - User data with normalized properties
 */
async function getUserData(end_user_id) {
  try {
    // Find end user using phone variations
    const endUser = await EndUser.query().where("id", end_user_id).first();
    if (!endUser) {
      throw boom.notFound("End user not found");
    }
    logger.info(
      `Found existing end user ${endUser.id} with phone ${endUser.phone}`,
    );

    // Normalize user data to ensure consistent property names
    const normalizedUserData = {
      ...endUser,
      userId: endUser.id, // Ensure userId property exists for webhook flow
    };

    return normalizedUserData;
  } catch (error) {
    logger.error("Error getting user data:", error);
    throw error;
  }
}

async function getBusinessChannel(business_channel_id) {
  try {
    // Find end user using phone variations
    const businessChannel = await BusinessChannel.query()
      .where("id", business_channel_id)
      .first();
    if (!businessChannel) {
      throw boom.notFound("Business Channel not found");
    }
    logger.info(`Found existing Business Channel ${businessChannel.id}`);

    return businessChannel;
  } catch (error) {
    logger.error("Error getting Business Channel:", error);
    throw error;
  }
}

/**
 * Process agent response using the new flow manager
 * @param {Object} payload - Message payload
 * @param {Object} userData - User data
 * @param {Object} agentId - Agent ID
 * @param {string} businessChannelId - Business channel ID
 * @returns {Promise<Object>} - Agent response payload
 */

async function handleDifferentAgents(
  payload,
  userData,
  agentId,
  businessChannelId = null,
) {
  try {
    // Use the new comprehensive flow manager
    return await handleCompleteConversationFlow(
      payload,
      userData,
      agentId,
      businessChannelId,
    );
  } catch (error) {
    logger.error("Error in handleDifferentAgents:", error);
    return {
      type: "text",
      text: "I apologize, but I encountered an error. Please try again.",
    };
  }
}

/**
 * Get message details by message ID
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} - Message details with business channel info
 */
async function getMessageDetails(messageId) {
  try {
    const message = await Message.query()
      .findById(messageId)
      .withGraphFetched("conversation.businessChannel");

    if (!message) {
      throw boom.notFound("Message not found");
    }

    return {
      message_id: message.id,
      conversation_id: message.conversation_id,
      business_channel_id: message.conversation.businessChannel.id,
      business_id: message.conversation.businessChannel.business_id,
      sender_type: message.sender_type,
      sender_id: message.sender_id,
    };
  } catch (error) {
    logger.error("Error getting message details:", error);
    throw error;
  }
}

/**
 * Get active conversation by conversation ID
 * @param {string} conversation_id - Conversation ID
 * @returns {Promise<Object|null>} - Active conversation or null
 */
async function getActiveConversation(conversation_id) {
  try {
    logger.info(`Looking for active conversation with ID: ${conversation_id}`);

    // Look for any active conversation with the given ID
    const conversation = await Conversation.query()
      .where({
        id: conversation_id,
        status: "active",
      })
      .first();

    if (!conversation) {
      logger.warn(`No active conversation found with ID: ${conversation_id}`);

      // Try to find any conversation with this ID regardless of status for debugging
      const anyConversation = await Conversation.query()
        .where("id", conversation_id)
        .first();

      if (anyConversation) {
        logger.info(`Found conversation with different status:`, {
          id: anyConversation.id,
          status: anyConversation.status,
          current_step: anyConversation.current_step,
          broadcast_id: anyConversation.broadcast_id,
        });
      } else {
        logger.warn(`No conversation found at all with ID: ${conversation_id}`);
      }

      throw boom.notFound("No active conversation found");
    }

    logger.info(`Found active conversation:`, {
      id: conversation.id,
      status: conversation.status,
      current_step: conversation.current_step,
      broadcast_id: conversation.broadcast_id,
      type: conversation.type,
    });

    return conversation;
  } catch (error) {
    logger.error("Error getting active conversation:", error);
    throw error;
  }
}

/**
 * Get broadcast details with agent mapping
 * @param {string} broadcastId - Broadcast ID
 * @returns {Promise<Object|null>} - Broadcast details or null
 */
async function getBroadcastDetails(broadcastId) {
  try {
    logger.info("Getting broadcast details:", { broadcastId });

    const Broadcast = require("../system/models/Broadcast");
    const broadcast = await Broadcast.query().where("id", broadcastId).first();

    if (broadcast) {
      logger.info("Found broadcast:", {
        broadcastId: broadcast.id,
        name: broadcast.name,
        agentMapping: broadcast.agent_mapping,
        metadata: broadcast.metadata,
      });
    } else {
      logger.warn("Broadcast not found:", broadcastId);
    }

    return broadcast;
  } catch (error) {
    logger.error("Error getting broadcast details:", error);
    throw error;
  }
}

/**
 * Get agent from broadcast mapping based on user response
 * @param {Object} broadcast - Broadcast object with agent_mapping
 * @param {string} userResponse - User's response text
 * @returns {Promise<Object|null>} - Agent details or null
 */
async function getAgentFromBroadcastMapping(broadcast_id, userResponse) {
  try {
    // Normalize user response for matching
    const normalizedResponse = userResponse.toLowerCase().trim();
    const broadcast = await getBroadcastDetails(broadcast_id);
    // Check for exact match first
    let agentId = broadcast.agent_mapping[normalizedResponse];

    // If no exact match, try partial matching for common responses
    if (!agentId) {
      for (const [key, value] of Object.entries(broadcast.agent_mapping)) {
        if (
          normalizedResponse.includes(key.toLowerCase()) ||
          key.toLowerCase().includes(normalizedResponse)
        ) {
          agentId = value;
          break;
        }
      }
    }

    if (!agentId) {
      logger.warn("No agent mapping found for response:", normalizedResponse);
      return null;
    }

    // Get agent details
    const agent = await Agent.query().where("id", agentId).first();

    if (agent) {
      logger.info("Found agent from broadcast mapping:", {
        agentId: agent.id,
        agentName: agent.name,
        response: normalizedResponse,
      });
    } else {
      logger.warn("Agent not found for ID from broadcast mapping:", agentId);
    }

    return agent;
  } catch (error) {
    logger.error("Error getting agent from broadcast mapping:", error);
    throw error;
  }
}

/**
 * Check for active outbound broadcast conversations when webhook responses are received
 * @param {string} userId - End user ID
 * @param {string} businessChannelId - Business channel ID
 * @returns {Promise<Object|null>} - Outbound broadcast conversation details or null
 */
async function checkForActiveOutboundBroadcastConversation(
  userId,
  businessChannelId,
) {
  try {
    logger.info("Checking for active outbound broadcast conversations:", {
      userId,
      businessChannelId,
    });

    // First, check for any active conversations for this user and channel
    const activeConversation = await getActiveConversation(
      userId,
      businessChannelId,
    );

    if (!activeConversation || !activeConversation.broadcast_id) {
      logger.info("No active broadcast conversation found");
      return null;
    }

    // Get broadcast details to check if it's outbound
    const broadcast = await getBroadcastDetails(
      activeConversation.broadcast_id,
    );

    if (!broadcast) {
      logger.warn(
        "Broadcast not found for conversation:",
        activeConversation.broadcast_id,
      );
      return null;
    }

    // Check if it's an outbound broadcast (use direct field first, fallback to metadata)
    const broadcastType =
      broadcast.type || broadcast.metadata?.type || "outbound";

    if (broadcastType === "outbound") {
      logger.info("Found active outbound broadcast conversation:", {
        conversationId: activeConversation.id,
        broadcastId: broadcast.id,
        broadcastName: broadcast.name,
        agentMapping: broadcast.agent_mapping,
      });

      return {
        conversation: activeConversation,
        broadcast: broadcast,
        type: broadcastType,
        shouldUseAgentMapping: true,
      };
    } else {
      logger.info("Found broadcast conversation but it's inbound type:", {
        conversationId: activeConversation.id,
        broadcastId: broadcast.id,
        type: broadcastType,
      });
      return null;
    }
  } catch (error) {
    logger.error(
      "Error checking for active outbound broadcast conversation:",
      error,
    );
    return null;
  }
}

/**
 * Get step node configuration for a specific agent and step
 * @param {string} agentId - Agent ID
 * @param {string} step - Step identifier (e.g., "step0", "step1")
 * @returns {Promise<Object|null>} - Step node configuration or null if not found
 */
async function getStepNode(agentId, step) {
  try {
    logger.info("Getting step node:", { agentId, step });

    // Use the existing getNodesByAgentAndStep function
    const nodes = await getNodesByAgentAndStep(agentId, step);

    if (!nodes || nodes.length === 0) {
      logger.info(`No step node found for agent ${agentId}, step ${step}`);
      return null;
    }

    // Return the first node (should only be one per step)
    const stepNode = nodes[0];

    logger.info(`Found step node for agent ${agentId}, step ${step}:`, {
      nodeId: stepNode.id,
      type: stepNode.type_of_message,
      enableAITakeover: stepNode.enable_ai_takeover,
    });

    return stepNode;
  } catch (error) {
    logger.error(
      `Error getting step node for agent ${agentId}, step ${step}:`,
      error,
    );
    return null;
  }
}

module.exports = {
  findAgentForMessage,
  getUserData,
  handleDifferentAgents,
  getMessageDetails,
  getBusinessChannel,
  getActiveConversation,
  getBroadcastDetails,
  getAgentFromBroadcastMapping,
  checkForActiveOutboundBroadcastConversation,
  getStepNode,
};
