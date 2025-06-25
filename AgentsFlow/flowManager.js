// AgentsFlow/flowManager.js
const logger = require("../system/utils/logger");
const { validateUserResponse } = require("./helper");
const {
  updateConversationStep,
  getNextStepNode,
  generateStepResponse,
  generateRetryResponse,
  getConversationVariables,
  closeConversation,
} = require("./conversationFlowService");
const {
  initializeBroadcastConversationFlow,
  handleBroadcastAgentAssignment,
  generateBroadcastReplyOptions,
} = require("./broadcastFlowIntegration");
const { trackConversationEvent } = require("./analytics");
const { getNodesByAgentAndStep } = require("../api/Agents/service");
const { EVENT_TYPES, ERROR_MESSAGES } = require("./config");
const {
  getPromptByBotName,
  handlingAiResponse,
  handleConfirmation,
} = require("./aiService");
const Conversation = require("../system/models/Conversation");
const Agent = require("../system/models/Agent");
const Broadcast = require("../system/models/Broadcast");

/**
 * Main flow manager - handles complete conversation flow logic
 * @param {Object} payload - Message payload
 * @param {Object} userData - User data
 * @param {Object} agentId - Agent ID
 * @param {string} businessChannelId - Business channel ID
 * @returns {Promise<Object>} - Flow response
 */
async function handleCompleteConversationFlow(
  payload,
  userData,
  agentId,
  businessChannelId,
) {
  try {
    logger.info("handleCompleteConversationFlow called with:", {
      hasPayload: !!payload,
      hasUserData: !!userData,
      agentId,
      businessChannelId,
      payloadType: payload?.type,
      messageText: payload?.messageContent?.text || payload?.text,
    });

    // Step 1: Handle broadcast-initiated conversations
    if (userData.broadcastId && !agentId) {
      logger.info("Routing to broadcast flow");
      return await handleBroadcastFlow(payload, userData, businessChannelId);
    }

    // Step 2: Handle agent-based conversations
    if (agentId) {
      logger.info(`Routing to agent flow with agent: ${agentId}`);
      return await handleAgentFlow(
        payload,
        userData,
        agentId,
        businessChannelId,
      );
    }

    // Step 3: Default fallback
    logger.info("Routing to default flow");
    return await handleDefaultFlow(payload, userData, businessChannelId);
  } catch (error) {
    logger.error("Error in complete conversation flow:", error);
    return {
      type: "text",
      text: "I apologize, but I encountered an error. Please try again or contact support.",
    };
  }
}

/**
 * Handle broadcast-initiated conversation flow
 * @param {Object} payload - Message payload
 * @param {Object} userData - User data
 * @param {string} businessChannelId - Business channel ID
 * @returns {Promise<Object>} - Response payload
 */
async function handleBroadcastFlow(payload, userData, businessChannelId) {
  try {
    // Get broadcast data
    const broadcast = await Broadcast.query().findById(userData.broadcastId);

    if (!broadcast) {
      logger.warn(`Broadcast not found: ${userData.broadcastId}`);
      return {
        type: "text",
        text: "Thank you for your message! How can I help you today?",
      };
    }

    // Get broadcast type from metadata
    const broadcastType = broadcast.metadata?.type || "outbound";

    logger.info("Processing broadcast flow:", {
      broadcastId: broadcast.id,
      type: broadcastType,
      agentMapping: broadcast.agent_mapping,
      userMessage: payload.messageContent.text,
    });

    // Initialize conversation flow
    const flowInit = await initializeBroadcastConversationFlow(
      userData,
      { id: businessChannelId },
      payload,
    );

    // For inbound broadcasts, agent selection is handled differently
    if (broadcastType === "inbound") {
      // Inbound broadcasts should use keyword matching (handled in controller)
      // This flow shouldn't reach here for inbound, but handle gracefully
      logger.info(
        "Inbound broadcast flow - agent should be determined by keyword matching",
      );
    } // Check if agent mapping is available for outbound broadcasts
    if (broadcastType === "outbound") {
      const hasAgentMapping =
        broadcast.agent_mapping &&
        Object.keys(broadcast.agent_mapping).length > 0;

      if (!hasAgentMapping) {
        // No agent mapping available - send default message and close conversation
        logger.info(
          "No agent mapping found for outbound broadcast - sending default message",
          {
            broadcastId: broadcast.id,
            broadcastName: broadcast.name,
            conversationId: flowInit.conversation.id,
          },
        );

        // Send default message from broadcast data
        const defaultMessage = broadcast.default_message;
        let responseMessage;

        if (defaultMessage && defaultMessage.content) {
          responseMessage = {
            type: defaultMessage.type || "text",
            text: defaultMessage.content,
          };
        } else {
          // Fallback message if no default message is configured
          responseMessage = {
            type: "text",
            text: "Thank you for your interest! We will get back to you soon.",
          };
        } // Close the conversation
        await closeConversation(
          flowInit.conversation.id,
          "no_agent_mapping_available",
          {
            default_message_sent: true,
            closed_by_system: true,
            broadcast_id: broadcast.id,
            broadcast_name: broadcast.name,
          },
        );

        logger.info("Conversation closed after sending default message", {
          conversationId: flowInit.conversation.id,
          broadcastId: broadcast.id,
          messageType: responseMessage.type,
        });

        return responseMessage;
      }

      // Agent mapping exists - show options if this is a new conversation
      if (flowInit.isNewFlow) {
        return await generateBroadcastReplyOptions(
          broadcast,
          broadcast.agent_mapping,
        );
      }
    }

    // If user selected an option, assign agent and start flow
    if (payload.messageContent.text && broadcast.agent_mapping) {
      const assignmentResult = await handleBroadcastAgentAssignment(
        flowInit.conversation,
        payload.messageContent,
        broadcast,
      );

      if (assignmentResult.success && assignmentResult.shouldStartAgentFlow) {
        // Start agent flow with first step
        return await handleAgentFlow(
          payload,
          userData,
          assignmentResult.agent,
          businessChannelId,
          flowInit.conversation,
        );
      }
    }

    // Default broadcast response
    return {
      type: "text",
      text: "Thank you for your interest! Please let us know how we can help you.",
    };
  } catch (error) {
    logger.error("Error handling broadcast flow:", error);
    throw error;
  }
}

/**
 * Handle agent-based conversation flow
 * @param {Object} payload - Message payload
 * @param {Object} userData - User data
 * @param {Object} agentId - Agent ID
 * @param {string} businessChannelId - Business channel ID
 * @param {Object} existingConversation - Existing conversation (optional)
 * @returns {Promise<Object>} - Response payload
 */
async function handleAgentFlow(payload, userData, agentId, businessChannelId) {
  try {
    logger.info(
      `Starting agent flow for agent: ${agentId}, user: ${
        userData?.userId || userData?.id
      }`,
    );

    // Get or create conversation - need to find the actual conversation, not use userData
    let conversation = null;

    // Try to find existing active conversation for this user and business channel
    conversation = await Conversation.query()
      .where("end_user_id", userData.userId || userData.id)
      .where("business_channel_id", businessChannelId)
      .where("status", "active")
      .first();

    if (!conversation) {
      // Create new conversation if none exists
      conversation = await Conversation.query().insert({
        business_channel_id: businessChannelId,
        end_user_id: userData.userId || userData.id,
        agent_id: agentId,
        status: "active",
        current_step: "step0",
        metadata: {
          variables: {},
          flow_started_at: new Date().toISOString(),
        },
      });
      logger.info(`Created new conversation: ${conversation.id}`);
    }

    // Get current step
    const currentStep = conversation.current_step || "step0";
    logger.info(`Processing step: ${currentStep} for agent: ${agentId}`);

    // Get step node configuration
    const stepNode = await getNodesByAgentAndStep(agentId, currentStep);

    if (!stepNode || (Array.isArray(stepNode) && stepNode.length === 0)) {
      logger.warn(
        `No step node found for agent: ${agentId}, step: ${currentStep}`,
      );
      return {
        type: "text",
        text: "I'm having trouble processing your request. Please try again.",
      };
    }

    const currentStepNode = Array.isArray(stepNode) ? stepNode[0] : stepNode;
    const conversationVariables = getConversationVariables(conversation);

    logger.info(
      `Current step node type: ${currentStepNode.type_of_message}, step: ${currentStep}`,
    ); // If this is the first message (step0) and no user input yet, send the initial step
    if (
      currentStep === "step0" &&
      !payload.text &&
      !payload.messageContent?.text
    ) {
      logger.info("Sending initial step message for step0");
      return generateStepResponse(currentStepNode, conversationVariables);
    }

    // Check if this is a confirmation response (from AI transform)
    const userMessage = payload.messageContent || payload;
    const postbackText = userMessage.postbackText || userMessage.text;

    if (postbackText === "confirm_yes" || postbackText === "confirm_no") {
      logger.info(`Processing confirmation response: ${postbackText}`);

      const userData = {
        userId: conversation.end_user_id,
        name: conversationVariables?.name || "User",
        currentStep: currentStep,
        capturedData: conversationVariables,
      };

      return await handleConfirmation(userData, postbackText, currentStepNode);
    }

    // Validate user response
    const validationResult = validateUserResponse(
      currentStepNode,
      payload.messageContent || payload,
    );
    console.log("validationResult", validationResult);

    // If validation failed, check if AI takeover is enabled
    if (!validationResult.isValid) {
      logger.warn(
        `Validation failed for step ${currentStep}: ${validationResult.reason}`,
      );

      // Check if AI takeover is enabled for this step
      if (currentStepNode?.enable_ai_takeover) {
        logger.info(
          `AI takeover enabled for step ${currentStep}, processing with AI`,
        );

        try {
          // Get agent data for AI processing
          const agentData = await Agent.query().findById(agentId);
          // Prepare user data context
          const userData = {
            userId: conversation.end_user_id,
            conversationId: conversation.id,
            name: conversationVariables?.name || "User",
            currentStep: currentStep,
            capturedData: conversationVariables,
            repeatCount: conversation.metadata?.numberOfRepeatMsg || 0,
          };

          // Get user's message text
          const messageBody =
            payload.messageContent?.text || payload.text || "";

          // Process with AI
          const jsonData = await getPromptByBotName(
            userData,
            currentStepNode,
            messageBody,
            agentData,
          );

          // Handle AI response
          const messageContent = await handlingAiResponse(
            jsonData,
            userData,
            currentStepNode,
            {
              /* flowData could be passed here if needed */
            },
          );

          // Track AI takeover event
          await trackConversationEvent(
            conversation.id,
            EVENT_TYPES.AI_PROCESSING_COMPLETED,
            {
              step: currentStep,
              ai_response_type: jsonData?.type,
              confidence: jsonData?.confidence,
              original_input: messageBody,
            },
          );

          return messageContent;
        } catch (aiError) {
          logger.error("AI takeover failed:", aiError);

          // Track AI failure
          await trackConversationEvent(
            conversation.id,
            EVENT_TYPES.AI_PROCESSING_FAILED,
            {
              step: currentStep,
              error: aiError.message,
              original_input: messageBody,
            },
          );

          // Fall back to standard retry response
          return generateRetryResponse(
            currentStepNode,
            validationResult.reason || "Please provide a valid response.",
            conversationVariables,
          );
        }
      } else {
        // Standard validation failure handling
        // Increment repeat counter
        const currentRepeatCount =
          conversation.metadata?.numberOfRepeatMsg || 0;

        // Update conversation with increased repeat count
        await Conversation.query().patchAndFetchById(conversation.id, {
          metadata: {
            ...conversation.metadata,
            numberOfRepeatMsg: currentRepeatCount + 1,
          },
        });

        logger.info(
          `Validation failed, repeat count: ${
            currentRepeatCount + 1
          } for user: ${conversation.end_user_id}`,
        );

        return generateRetryResponse(
          currentStepNode,
          validationResult.reason || "Please provide a valid response.",
          conversationVariables,
        );
      }
    }

    logger.info(`Validation passed for step ${currentStep}`);

    // Update conversation with captured data
    if (validationResult.capturedValue && currentStepNode.variable) {
      await updateConversationStep(conversation.id, currentStep, {
        variable: currentStepNode.variable,
        value: validationResult.capturedValue,
      });
      conversationVariables[currentStepNode.variable] =
        validationResult.capturedValue;
    }

    // Determine next step
    const nextStepIdentifier =
      validationResult.nextStep ||
      (currentStepNode.next_possible_steps &&
        currentStepNode.next_possible_steps[0]) ||
      null;

    if (!nextStepIdentifier || nextStepIdentifier === "stop") {
      // Conversation is complete
      await Conversation.query().patchAndFetchById(conversation.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
      });

      return {
        type: "text",
        text: "Thank you! Your conversation has been completed successfully.",
      };
    }

    // Get next step node
    const nextStepNode = await getNodesByAgentAndStep(
      agentId,
      nextStepIdentifier,
    );

    if (
      !nextStepNode ||
      (Array.isArray(nextStepNode) && nextStepNode.length === 0)
    ) {
      logger.warn(
        `Next step node not found for agent: ${agentId}, step: ${nextStepIdentifier}`,
      );
      return {
        type: "text",
        text: "Thank you for your responses!",
      };
    }

    const nextStepNodeData = Array.isArray(nextStepNode)
      ? nextStepNode[0]
      : nextStepNode;

    // Update conversation to next step
    await updateConversationStep(conversation.id, nextStepIdentifier, {});

    // Generate response for next step
    const response = generateStepResponse(
      nextStepNodeData,
      conversationVariables,
    );

    logger.info(`Generated response for next step: ${nextStepIdentifier}`);

    return response;
  } catch (error) {
    logger.error("Error handling agent flow:", error);
    return {
      type: "text",
      text: "I apologize, but I encountered an error. Please try again.",
    };
  }
}

/**
 * Handle default conversation flow (fallback)
 * @param {Object} payload - Message payload
 * @param {Object} userData - User data
 * @param {string} businessChannelId - Business channel ID
 * @returns {Promise<Object>} - Response payload
 */
async function handleDefaultFlow(payload, userData, businessChannelId) {
  try {
    // Simple fallback response
    return {
      type: "text",
      text: "Hello! Thank you for reaching out. How can I assist you today?",
    };
  } catch (error) {
    logger.error("Error handling default flow:", error);
    return {
      type: "text",
      text: "Hello! How can I help you today?",
    };
  }
}

module.exports = {
  handleCompleteConversationFlow,
  handleBroadcastFlow,
  handleAgentFlow,
  handleDefaultFlow,
};
