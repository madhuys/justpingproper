// AgentsFlow/broadcastFlowIntegration.js
const logger = require("../system/utils/logger");
const Conversation = require("../system/models/Conversation");
const Agent = require("../system/models/Agent");
const { getNodesByAgentAndStep } = require("../api/Agents/service");

/**
 * Initialize conversation flow when user replies to broadcast
 * @param {Object} userData - User data from broadcast
 * @param {Object} businessChannel - Business channel info
 * @param {Object} messagePayload - Incoming message
 * @returns {Promise<Object>} - Flow initialization result
 */
async function initializeBroadcastConversationFlow(
  userData,
  businessChannel,
  messagePayload,
) {
  try {
    logger.info(
      `Initializing broadcast conversation flow for user: ${userData.userId}`,
    );

    // Find or create conversation
    let conversation = await Conversation.query()
      .where("end_user_id", userData.userId)
      .where("business_channel_id", businessChannel.id)
      .where("status", "active")
      .first();

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.query().insert({
        business_channel_id: businessChannel.id,
        end_user_id: userData.userId,
        broadcast_id: userData.broadcastId,
        business_id: userData.business_id,
        status: "active",
        current_step: "step0",
        metadata: {
          initiated_from_broadcast: true,
          broadcast_id: userData.broadcastId,
          broadcast_type: userData.broadcastType || "outbound",
          captured_variables: {},
          flow_started_at: new Date().toISOString(),
        },
      });

      logger.info(
        `Created new conversation from broadcast: ${conversation.id}`,
      );
    }

    return {
      conversation,
      isNewFlow: !conversation.agent_id,
      shouldStartFlow: true,
    };
  } catch (error) {
    logger.error(
      `Error initializing broadcast conversation flow: ${error.message}`,
      error,
    );
    throw error;
  }
}

/**
 * Handle agent assignment from broadcast button clicks
 * @param {Object} conversation - Conversation object
 * @param {Object} messageContent - Message content with button selection
 * @param {Object} broadcastData - Broadcast data with agent mapping
 * @returns {Promise<Object>} - Agent assignment result
 */
async function handleBroadcastAgentAssignment(
  conversation,
  messageContent,
  broadcastData,
) {
  try {
    const buttonText = messageContent.text;
    const agentMapping = broadcastData.agent_mapping || {};

    // Find agent ID from button mapping
    let assignedAgentId = null;
    for (const [buttonKey, agentId] of Object.entries(agentMapping)) {
      if (buttonText.toLowerCase().includes(buttonKey.toLowerCase())) {
        assignedAgentId = agentId;
        break;
      }
    }

    if (!assignedAgentId) {
      logger.warn(`No agent mapping found for button: ${buttonText}`);
      return { success: false, error: "No agent assigned for this option" };
    }

    // Validate agent exists and is active
    const agent = await Agent.query()
      .where("id", assignedAgentId)
      .where("status", "active")
      .first();

    if (!agent) {
      logger.warn(`Agent not found or inactive: ${assignedAgentId}`);
      return { success: false, error: "Selected agent is not available" };
    }

    // Update conversation with agent assignment
    await Conversation.query().patchAndFetchById(conversation.id, {
      agent_id: assignedAgentId,
      current_step: "step0",
      metadata: {
        ...conversation.metadata,
        agent_assigned_at: new Date().toISOString(),
        selected_service: buttonText,
      },
    });

    logger.info(
      `Assigned agent ${assignedAgentId} to conversation ${conversation.id}`,
    );

    return {
      success: true,
      agent,
      shouldStartAgentFlow: true,
    };
  } catch (error) {
    logger.error(
      `Error handling broadcast agent assignment: ${error.message}`,
      error,
    );
    throw error;
  }
}

/**
 * Generate broadcast reply options based on agent mapping
 * @param {Object} broadcastData - Broadcast data
 * @param {Object} agentMapping - Agent mapping configuration
 * @returns {Object} - Response with options
 */
async function generateBroadcastReplyOptions(broadcastData, agentMapping = {}) {
  try {
    if (!agentMapping || Object.keys(agentMapping).length === 0) {
      // No agent mapping available - return default message from broadcast data
      logger.info(
        "No agent mapping available for broadcast - using default message",
        {
          broadcastId: broadcastData.id,
          broadcastName: broadcastData.name,
          hasDefaultMessage: !!(
            broadcastData.default_message &&
            broadcastData.default_message.content
          ),
        },
      );

      const defaultMessage = broadcastData.default_message;
      if (defaultMessage && defaultMessage.content) {
        return {
          type: defaultMessage.type || "text",
          text: defaultMessage.content,
        };
      } else {
        // Fallback message if no default message is configured
        return {
          type: "text",
          text: "Thank you for your interest! We will get back to you soon.",
        };
      }
    }

    // Get agent details for each mapped agent
    const agentIds = Object.values(agentMapping);
    const agents = await Agent.query()
      .whereIn("id", agentIds)
      .where("status", "active")
      .select("id", "name", "description");

    const options = Object.entries(agentMapping).map(([buttonKey, agentId]) => {
      const agent = agents.find((a) => a.id === agentId);
      return {
        type: "reply",
        reply: {
          id: `agent_${agentId}`,
          title: buttonKey,
          description:
            agent?.description || `Connect with ${agent?.name || "our team"}`,
        },
      };
    });

    return {
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: "How can we help you today? Please select a service:",
        },
        action: {
          buttons: options.slice(0, 3), // WhatsApp button limit
        },
      },
    };
  } catch (error) {
    logger.error(
      `Error generating broadcast reply options: ${error.message}`,
      error,
    );
    return {
      type: "text",
      text: "Thank you for your interest! Please reply with your query and we'll assist you.",
    };
  }
}

module.exports = {
  initializeBroadcastConversationFlow,
  handleBroadcastAgentAssignment,
  generateBroadcastReplyOptions,
};
