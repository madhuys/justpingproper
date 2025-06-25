// AgentsFlow/webhookFlowManager.js
const logger = require("../system/utils/logger");
const rateLimit = require("express-rate-limit");
const { handleCompleteConversationFlow } = require("./flowManager");
const { sendWhatsAppMessage } = require("./whatsAppServiceProviders");
const { trackConversationEvent } = require("./analytics");
const service = require("./service");
const aiProcessor = require("./aiProcessor");
const { validateUserResponse } = require("./helper");
const { generateRetryResponse } = require("./conversationFlowService");
const { ERROR_MESSAGES, EVENT_TYPES } = require("./config");
const {
  validateAgentAssignment,
  findAgentWithKeywordFallback,
  findOrAssignAgentWithPersistence,
} = require("./strictAgentValidator");

/**
 * Main webhook flow manager implementing the complete conversational flow
 *
 * Flow: Webhook Received → Provider-specific endpoint → Middleware Processing →
 * Normalize to common format → User Lookup → Find/create user data →
 * Rate Limiting → Check for spam/abuse → Socket Emission → Real-time user message →
 * Agent Loading → Get conversation flow → Step Validation → Check if input is valid →
 * AI Processing → (If enabled) Send to AI for analysis → Response Generation →
 * Create appropriate response → Message Personalization → Replace variables with user data →
 * History Update → Store conversation → Message Sending → Send via appropriate provider →
 * Socket Emission → Real-time bot response
 */

/**
 * Rate limiting middleware for webhook endpoints
 */
const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many webhook requests, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for known provider IPs (configurable)
  skip: (req) => {
    const trustedIPs = process.env.TRUSTED_WEBHOOK_IPS?.split(",") || [];
    return trustedIPs.includes(req.ip);
  },
});

/**
 * User-specific rate limiting to prevent spam/abuse
 */
const createUserRateLimit = (maxRequests = 10, windowMs = 60000) => {
  const userRequests = new Map();

  return (userId) => {
    const now = Date.now();
    const userKey = `user_${userId}`;

    if (!userRequests.has(userKey)) {
      userRequests.set(userKey, []);
    }

    const requests = userRequests.get(userKey);

    // Clean old requests outside the window
    const validRequests = requests.filter(
      (timestamp) => now - timestamp < windowMs,
    );
    userRequests.set(userKey, validRequests);

    // Check if user exceeds rate limit
    if (validRequests.length >= maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    return true;
  };
};

const userRateLimitChecker = createUserRateLimit(10, 60000); // 10 messages per minute per user

/**
 * Step 1: Webhook Received → Provider-specific endpoint
 * Already handled by route.js with provider-specific middleware
 */

/**
 * Step 2: Middleware Processing → Normalize to common format
 * Already handled by karixMiddleware and metaMiddleware
 */

/**
 * Step 3-14: Complete webhook flow processing
 * @param {Object} req - Express request with normalized payload
 * @returns {Promise<Object>} - Processing result
 */
async function processWebhookFlow(req) {
  const startTime = Date.now();
  let userData = null;
  let businessChannel = null;
  let conversationId = null;

  try {
    // Step 3: User Lookup → Find/create user data
    const userLookupResult = await performUserLookup(req);
    userData = userLookupResult.userData;
    businessChannel = userLookupResult.businessChannel;
    conversationId = userLookupResult.conversationId;

    logger.info(`User lookup completed: ${userData?.userId}`, {
      userId: userData?.userId,
      businessChannelId: businessChannel?.id,
      conversationId,
    });

    // Step 4: Rate Limiting → Check for spam/abuse
    const rateLimitResult = await checkRateLimiting(userData, req);
    if (!rateLimitResult.allowed) {
      logger.warn(`Rate limit exceeded for user: ${userData?.userId}`, {
        userId: userData?.userId,
        reason: rateLimitResult.reason,
      });

      await trackConversationEvent(conversationId, EVENT_TYPES.ERROR_OCCURRED, {
        error: "rate_limit_exceeded",
        userId: userData?.userId,
      });

      return {
        success: false,
        error: "Rate limit exceeded",
        code: "RATE_LIMIT_EXCEEDED",
      };
    }

    // Step 5: Socket Emission → Real-time user message
    await emitUserMessageToSocket(req, userData, {
      type: "user_message_received",
      messageContent: req.payload.messageContent,
      timestamp: new Date().toISOString(),
    }); // Step 6: Agent Loading → Get conversation flow
    const agentLoadResult = await loadConversationAgent(
      req,
      userData,
      businessChannel,
      conversationId,
    );
    if (!agentLoadResult.success) {
      logger.error(`Agent loading failed for user: ${userData?.userId}`, {
        error: agentLoadResult.error,
        code: agentLoadResult.code,
        details: agentLoadResult.details,
      });
      await trackConversationEvent(conversationId, EVENT_TYPES.ERROR_OCCURRED, {
        error: "agent_loading_failed",
        errorCode: agentLoadResult.code,
        details: agentLoadResult.error,
        validationDetails: agentLoadResult.details,
      });

      // Generate appropriate error response based on the type of failure
      const errorType =
        agentLoadResult.code === "AGENT_NOT_IN_MAPPING" ||
        agentLoadResult.code === "AGENT_INACTIVE_OR_NOT_FOUND"
          ? "strict_validation_failed"
          : "agent_not_found";

      return await generateErrorResponse(
        userData,
        businessChannel,
        errorType,
        agentLoadResult.error,
        req.payload.receiver,
      );
    }
    const { agentData, existingConversation, validationDetails } =
      agentLoadResult;

    // Log successful agent loading with validation details
    logger.info("Agent loaded successfully:", {
      userId: userData?.userId,
      agentId: agentData?.id || null,
      agentName: agentData?.name || "No agent (broadcast no mapping)",
      validationType: validationDetails?.validationType,
      isBroadcastConversation: validationDetails?.isBroadcastConversation,
    });

    // Step 7: Step Validation → Check if input is valid
    const validationResult = await validateUserInput(
      req.payload.messageContent,
      existingConversation,
      agentData,
    );

    if (!validationResult.isValid) {
      logger.debug(`Validation failed for user: ${userData?.userId}`, {
        reason: validationResult.reason,
        input: req.payload.messageContent?.text,
      });
      await trackConversationEvent(
        conversationId,
        EVENT_TYPES.VALIDATION_FAILED,
        {
          reason: validationResult.reason,
          input: req.payload.messageContent?.text,
          step: existingConversation?.current_step,
        },
      );

      // Add original input to validation result for AI processing
      const enhancedValidationResult = {
        ...validationResult,
        originalInput: req.payload.messageContent?.text || "",
      };

      return await generateValidationErrorResponse(
        userData,
        businessChannel,
        enhancedValidationResult,
        existingConversation,
        agentData,
        req.payload.receiver,
      );
    }

    await trackConversationEvent(
      conversationId,
      EVENT_TYPES.VALIDATION_SUCCEEDED,
      {
        input: req.payload.messageContent?.text,
        step: existingConversation?.current_step,
      },
    );

    // Step 8: AI Processing → (If enabled) Send to AI for analysis
    let aiEnhancedPayload = req.payload;
    const shouldUseAI = await checkAIProcessingEnabled(
      existingConversation,
      agentData,
    );

    if (shouldUseAI) {
      try {
        const aiResult = await performAIProcessing(
          req.payload.messageContent,
          existingConversation,
          agentData,
          userData,
        );

        if (aiResult.success) {
          aiEnhancedPayload = {
            ...req.payload,
            aiAnalysis: aiResult.analysis,
            aiSuggestions: aiResult.suggestions,
          };

          logger.info(`AI processing completed for user: ${userData?.userId}`, {
            hasAnalysis: !!aiResult.analysis,
            hasSuggestions: !!aiResult.suggestions,
          });
        }
      } catch (aiError) {
        logger.warn(
          `AI processing failed, continuing without AI: ${aiError.message}`,
          {
            userId: userData?.userId,
            step: existingConversation?.current_step,
          },
        );
      }
    } // Step 9: Response Generation → Create appropriate response
    const responseResult = await generateConversationResponse(
      aiEnhancedPayload,
      existingConversation,
      agentData?.id || null, // Handle case where agentData is null (no agent mapping)
      businessChannel,
      userData, // Pass userData to the response generation function
    );

    if (!responseResult.success) {
      logger.error(
        `Response generation failed for user: ${userData?.userId}`,
        responseResult.error,
      );
      await trackConversationEvent(conversationId, EVENT_TYPES.ERROR_OCCURRED, {
        error: "response_generation_failed",
        details: responseResult.error,
      });

      return await generateErrorResponse(
        userData,
        businessChannel,
        "general_error",
        responseResult.error,
        req.payload.receiver,
      );
    }

    // Step 10: Message Personalization → Replace variables with user data
    const personalizedResponse = await personalizeResponse(
      responseResult.response,
      userData,
      existingConversation,
    );

    // Step 11: History Update → Store conversation
    await updateConversationHistory(
      existingConversation,
      req.payload.messageContent,
      personalizedResponse,
      userData,
    );

    // Step 12: Message Sending → Send via appropriate provider
    const sendResult = await sendResponseMessage(
      userData,
      personalizedResponse,
      businessChannel,
      req.payload.receiver,
    );

    if (!sendResult.success) {
      logger.error(
        `Message sending failed for user: ${userData?.userId}`,
        sendResult.error,
      );

      await trackConversationEvent(conversationId, EVENT_TYPES.ERROR_OCCURRED, {
        error: "message_sending_failed",
        details: sendResult.error,
      });

      // Don't return error here as conversation state is already updated
    }

    // Step 13: Socket Emission → Real-time bot response
    await emitBotResponseToSocket(req, userData, personalizedResponse);

    // Step 14: Analytics and completion tracking
    const processingTime = Date.now() - startTime;
    await trackConversationEvent(conversationId, EVENT_TYPES.STEP_COMPLETED, {
      step: existingConversation?.current_step,
      processingTime,
      aiUsed: shouldUseAI,
      responseType: personalizedResponse?.type,
    });

    logger.info(
      `Webhook flow completed successfully for user: ${userData?.userId}`,
      {
        processingTime,
        responseType: personalizedResponse?.type,
        aiUsed: shouldUseAI,
      },
    );

    return {
      success: true,
      message: "Webhook flow processed successfully",
      processingTime,
      data: {
        userId: userData?.userId,
        responseType: personalizedResponse?.type,
        conversationId: existingConversation?.id,
      },
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error("Critical error in webhook flow processing:", {
      error: error.message,
      stack: error.stack,
      userId: userData?.userId,
      processingTime,
    });

    await trackConversationEvent(conversationId, EVENT_TYPES.ERROR_OCCURRED, {
      error: "critical_flow_error",
      message: error.message,
      processingTime,
    }); // Attempt to send error response to user
    if (userData && businessChannel) {
      try {
        await generateErrorResponse(
          userData,
          businessChannel,
          "general_error",
          error.message,
          req.payload?.receiver,
        );
      } catch (fallbackError) {
        logger.error("Failed to send error response to user:", fallbackError);
      }
    }

    return {
      success: false,
      error: "Internal processing error",
      code: "PROCESSING_FAILED",
      processingTime,
    };
  }
}

/**
 * Step 3: User Lookup → Find/create user data
 */
async function performUserLookup(req) {
  try {
    // Get message details to extract business channel info
    const messageDetails = await service.getMessageDetails(
      req.payload.messageContent.messageId,
    );

    // Get user data using business channel ID from the stored message
    const rawUserData = await service.getUserData(messageDetails.sender_id); // Normalize userData to ensure it has userId property
    const userData = {
      ...rawUserData,
      userId: rawUserData.id, // Map id to userId for consistency
    };

    // Get business channel information
    const businessChannel = await service.getBusinessChannel(
      messageDetails?.business_channel_id,
    );

    // Get or find conversation
    const existingConversation = await service.getActiveConversation(
      messageDetails.conversation_id,
    );

    // Add broadcast information to userData if this is a broadcast conversation
    if (existingConversation?.broadcast_id) {
      userData.broadcastId = existingConversation.broadcast_id;
      userData.broadcastType =
        existingConversation.metadata?.broadcast_type || "outbound";
    }

    return {
      success: true,
      userData,
      businessChannel,
      conversationId:
        existingConversation?.id || messageDetails.conversation_id,
    };
  } catch (error) {
    logger.error("User lookup failed:", error);
    throw new Error(`User lookup failed: ${error.message}`);
  }
}

/**
 * Step 4: Rate Limiting → Check for spam/abuse
 */
async function checkRateLimiting(userData, req) {
  try {
    // Enhanced user validation
    if (!userData) {
      logger.warn("Rate limiting failed: no userData provided");
      return { allowed: false, reason: "no_user_data" };
    }

    if (!userData.userId && !userData.id) {
      logger.warn("Rate limiting failed: no userId or id in userData", {
        userData,
      });
      return { allowed: false, reason: "no_user_id" };
    }

    // Use userId if available, fallback to id
    const userId = userData.userId || userData.id;

    // Check user-specific rate limit
    const userAllowed = userRateLimitChecker(userId);
    if (!userAllowed) {
      logger.warn(`User rate limit exceeded for userId: ${userId}`);
      return { allowed: false, reason: "user_rate_limit_exceeded" };
    }

    // Additional spam detection logic
    const messageText = req.payload.messageContent?.text || "";

    // Check for suspicious patterns
    if (messageText.length > 1000) {
      return { allowed: false, reason: "message_too_long" };
    }

    // Check for repeated characters (potential spam)
    const repeatedCharPattern = /(.)\1{10,}/;
    if (repeatedCharPattern.test(messageText)) {
      return { allowed: false, reason: "repeated_characters" };
    }

    // Check for excessive special characters
    const specialCharCount = (
      messageText.match(/[!@#$%^&*(),.?":{}|<>]/g) || []
    ).length;
    if (specialCharCount > messageText.length * 0.5) {
      return { allowed: false, reason: "excessive_special_characters" };
    }

    return { allowed: true };
  } catch (error) {
    logger.error("Rate limiting check failed:", error);
    // Fail safe - allow the message through
    return { allowed: true };
  }
}

/**
 * Step 5: Socket Emission → Real-time user message
 */
async function emitUserMessageToSocket(req, userData, messageData) {
  try {
    if (req.io && userData?.userId) {
      req.io.to(userData.userId).emit("user_message", {
        ...messageData,
        userId: userData.userId,
        timestamp: new Date().toISOString(),
      });

      logger.debug("User message emitted to socket", {
        userId: userData.userId,
      });
    }
  } catch (error) {
    logger.error("Failed to emit user message to socket:", error);
    // Non-critical error, continue processing
  }
}

/**
 * Step 6: Agent Loading → Get conversation flow with strict validation for broadcasts
 */
async function loadConversationAgent(
  req,
  userData,
  businessChannel,
  conversationId = null,
) {
  try {
    let agentData = null;
    let existingConversation = null;

    // Get existing conversation using the conversation ID from user lookup
    if (conversationId) {
      try {
        existingConversation = await service.getActiveConversation(
          conversationId,
        );
      } catch (error) {
        logger.warn(
          `Could not find active conversation with ID: ${conversationId}`,
          error.message,
        );
        // Continue without existing conversation - this might be a new conversation
      }
    }

    // Check if this is a broadcast conversation and get broadcast details
    const broadcastId =
      existingConversation?.broadcast_id ||
      existingConversation?.metadata?.broadcast_id;

    const isBroadcastConversation = !!broadcastId;

    logger.info("Agent loading context:", {
      conversationId,
      isBroadcastConversation,
      broadcastId,
      broadcastType: existingConversation?.metadata?.broadcast_type,
      hasExistingConversation: !!existingConversation,
    });
    if (isBroadcastConversation) {
      // For broadcast conversations, use agent persistence logic
      logger.info(
        "Processing broadcast conversation - applying agent persistence with keyword fallback logic",
      );

      // Use the new agent persistence logic to find or reuse agent
      const persistenceResult = await findOrAssignAgentWithPersistence(
        conversationId,
        req.payload.messageContent.text,
        broadcastId,
      );
      if (!persistenceResult.success) {
        logger.warn("Agent persistence finding failed:", {
          conversationId,
          userInput: req.payload.messageContent.text,
          error: persistenceResult.error,
          code: persistenceResult.code,
        });

        // Check if this is a "no agent mapping" scenario - allow flow to continue
        if (persistenceResult.code === "NO_AGENT_MAPPING") {
          logger.info(
            "No agent mapping available - allowing broadcast flow to handle default message",
            {
              conversationId,
              broadcastId,
              userInput: req.payload.messageContent.text,
            },
          );

          // Return success with null agent to allow broadcast flow to handle
          return {
            success: true,
            agentData: null,
            existingConversation,
            validationDetails: {
              isBroadcastConversation,
              broadcastId,
              validationType: "broadcast_no_agent_mapping",
              shouldUseBroadcastFlow: true,
            },
          };
        }

        await trackConversationEvent(
          conversationId,
          EVENT_TYPES.ERROR_OCCURRED,
          {
            error: "agent_persistence_failed",
            userInput: req.payload.messageContent.text,
            errorDetails: persistenceResult.error,
            errorCode: persistenceResult.code,
          },
        );

        return {
          success: false,
          error: persistenceResult.error,
          code: persistenceResult.code,
          details: persistenceResult.details,
        };
      }

      // Use the agent found or assigned by persistence logic
      agentData = persistenceResult.agent;

      // Log successful agent persistence matching
      logger.info("Agent found/assigned using persistence logic:", {
        conversationId,
        agentId: agentData.id,
        agentName: agentData.name,
        persistenceType: persistenceResult.persistenceDetails.persistenceType,
        wasExistingAssignment:
          persistenceResult.persistenceDetails.isExistingAssignment,
        wasNewlyAssigned: persistenceResult.persistenceDetails.wasNewlyAssigned,
        matchType: persistenceResult.matchDetails?.matchType,
        matchedKeyword: persistenceResult.matchDetails?.keyword,
        userInput: req.payload.messageContent.text,
      });

      await trackConversationEvent(
        conversationId,
        EVENT_TYPES.VALIDATION_SUCCEEDED,
        {
          agentId: agentData.id,
          agentName: agentData.name,
          persistenceType: persistenceResult.persistenceDetails.persistenceType,
          wasExistingAssignment:
            persistenceResult.persistenceDetails.isExistingAssignment,
          wasNewlyAssigned:
            persistenceResult.persistenceDetails.wasNewlyAssigned,
          matchType: persistenceResult.matchDetails?.matchType,
          matchedKeyword: persistenceResult.matchDetails?.keyword,
          userInput: req.payload.messageContent.text,
          validationMode: "agent_persistence_with_keyword_fallback",
          broadcastType: persistenceResult.broadcast?.type,
        },
      );
    } else {
      // For non-broadcast conversations, use regular agent lookup
      logger.info(
        "Processing regular conversation - using standard agent lookup",
      );

      agentData = await service.findAgentForMessage(
        businessChannel.id,
        req.payload.messageContent.text,
      );

      if (agentData) {
        logger.info("Agent found for regular conversation:", {
          agentId: agentData.id,
          agentName: agentData.name,
        });
      }
    }

    if (!agentData) {
      const errorMessage = isBroadcastConversation
        ? "No suitable agent found for this broadcast conversation"
        : "No suitable agent found for this conversation";

      logger.warn("Agent loading failed:", {
        conversationId,
        isBroadcastConversation,
        broadcastId,
        messageText: req.payload.messageContent.text,
      });

      return {
        success: false,
        error: errorMessage,
        code: "NO_SUITABLE_AGENT",
      };
    }

    logger.info("Agent loading completed successfully:", {
      conversationId,
      agentId: agentData.id,
      agentName: agentData.name,
      isBroadcastConversation,
      validationType: isBroadcastConversation ? "strict_broadcast" : "regular",
    });

    return {
      success: true,
      agentData,
      existingConversation,
      validationDetails: {
        isBroadcastConversation,
        broadcastId,
        validationType: isBroadcastConversation
          ? "strict_broadcast"
          : "regular",
      },
    };
  } catch (error) {
    logger.error("Agent loading failed:", error);

    await trackConversationEvent(conversationId, EVENT_TYPES.ERROR_OCCURRED, {
      error: "agent_loading_failed",
      details: error.message,
    });

    return {
      success: false,
      error: error.message,
      code: "AGENT_LOADING_ERROR",
    };
  }
}

/**
 * Step 7: Step Validation → Check if input is valid
 */
async function validateUserInput(messageContent, conversation, agentData) {
  try {
    if (!conversation || !agentData) {
      return { isValid: true }; // Allow to proceed if no specific validation context
    }

    // Get current step node for validation
    const currentStep = conversation.current_step;
    if (!currentStep) {
      return { isValid: true };
    } // Get step configuration from agent
    const stepNode = await service.getStepNode(agentData.id, currentStep);
    if (!stepNode) {
      return { isValid: true };
    }

    // Perform validation based on step requirements
    const validationResult = await validateUserResponse(
      stepNode,
      messageContent,
    );

    return {
      isValid: validationResult.isValid,
      reason: validationResult.reason || null,
      capturedValue: validationResult.capturedValue || null,
      nextStep: validationResult.nextStep || null,
    };
  } catch (error) {
    logger.error("Step validation failed:", error);
    // Default to valid if validation fails
    return { isValid: true };
  }
}

/**
 * Step 8: AI Processing → (If enabled) Send to AI for analysis
 */
async function checkAIProcessingEnabled(conversation, agentData) {
  try {
    if (!conversation || !agentData) {
      return false;
    }

    // Check if current step has AI takeover enabled
    const currentStep = conversation.current_step;
    if (!currentStep) {
      return false;
    }

    const stepNode = await service.getStepNode(agentData.id, currentStep);
    return stepNode?.enable_ai_takeover === true;
  } catch (error) {
    logger.error("AI processing check failed:", error);
    return false;
  }
}

async function performAIProcessing(
  messageContent,
  conversation,
  agentData,
  userData,
) {
  try {
    return await aiProcessor.processUserMessage({
      messageContent,
      conversation,
      agentData,
      userData,
      context: {
        currentStep: conversation?.current_step,
        conversationHistory: conversation?.metadata?.variables || {},
      },
    });
  } catch (error) {
    logger.error("AI processing failed:", error);
    throw error;
  }
}

/**
 * Step 9: Response Generation → Create appropriate response
 */
async function generateConversationResponse(
  payload,
  conversation,
  agentId,
  businessChannel,
  userData,
) {
  try {
    // The handleCompleteConversationFlow expects userData object, not just the ID
    const response = await handleCompleteConversationFlow(
      payload,
      userData, // Pass the full userData object instead of conversation?.end_user_id
      agentId,
      businessChannel.id,
    );

    if (!response) {
      return {
        success: false,
        error: "No response generated from conversation flow",
      };
    }

    return {
      success: true,
      response,
    };
  } catch (error) {
    logger.error("Response generation failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Step 10: Message Personalization → Replace variables with user data
 */
async function personalizeResponse(response, userData, conversation) {
  try {
    return await service.personalizeMessage(response, {
      ...userData,
      conversationVariables: conversation?.metadata?.variables || {},
    });
  } catch (error) {
    logger.error("Message personalization failed:", error);
    // Return original response if personalization fails
    return response;
  }
}

/**
 * Step 11: History Update → Store conversation
 */
async function updateConversationHistory(
  conversation,
  userMessage,
  botResponse,
  userData,
) {
  try {
    // Implementation would update conversation history
    // This is typically handled by the conversation flow service
    logger.debug("Conversation history updated", {
      conversationId: conversation?.id,
      userId: userData?.userId,
    });
  } catch (error) {
    logger.error("Failed to update conversation history:", error);
    // Non-critical error, continue processing
  }
}

/**
 * Step 12: Message Sending → Send via appropriate provider
 */
async function sendResponseMessage(
  userData,
  responsePayload,
  businessChannel,
  webhookReceiverNumber,
) {
  try {
    // ALWAYS use the webhook receiver number as sender (req.payload.receiver)
    // This is the number that received the original message and should be used for sending replies
    const senderPhoneNumber = webhookReceiverNumber;

    if (!senderPhoneNumber) {
      logger.error("No webhook receiver number available for message sending", {
        businessChannelId: businessChannel?.id,
        provider: businessChannel?.provider_name,
        webhookReceiverNumber,
      });

      return {
        success: false,
        error: "No webhook receiver number available",
      };
    }

    logger.info("Using webhook receiver number as sender phone number", {
      senderPhoneNumber,
      provider: businessChannel?.provider_name,
      webhookReceiverNumber,
      note: "Always using webhook receiver (req.payload.receiver) as sender",
    });

    await sendWhatsAppMessage(
      userData,
      responsePayload,
      businessChannel,
      senderPhoneNumber,
    );

    return { success: true };
  } catch (error) {
    logger.error("Message sending failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Step 13: Socket Emission → Real-time bot response
 */
async function emitBotResponseToSocket(req, userData, responsePayload) {
  try {
    if (req.io && userData?.userId) {
      req.io.to(userData.userId).emit("bot_response", {
        messageContent: responsePayload,
        userId: userData.userId,
        role: "assistant",
        timestamp: new Date().toISOString(),
      });

      logger.debug("Bot response emitted to socket", {
        userId: userData.userId,
      });
    }
  } catch (error) {
    logger.error("Failed to emit bot response to socket:", error);
    // Non-critical error, continue processing
  }
}

/**
 * Generate error response for users
 */
async function generateErrorResponse(
  userData,
  businessChannel,
  errorType,
  customMessage = null,
  webhookReceiverNumber = null,
) {
  try {
    const errorMessage =
      customMessage ||
      ERROR_MESSAGES.system[errorType] ||
      ERROR_MESSAGES.system.generalError;

    const errorResponse = {
      type: "text",
      text: errorMessage,
    };

    // Use webhook receiver number as sender if available
    if (webhookReceiverNumber) {
      await sendWhatsAppMessage(
        userData,
        errorResponse,
        businessChannel,
        webhookReceiverNumber,
      );
    } else {
      logger.warn("No webhook receiver number available for error response", {
        businessChannelId: businessChannel?.id,
        errorType,
      });
    }

    return {
      success: false,
      error: errorType,
      message: errorMessage,
    };
  } catch (error) {
    logger.error("Failed to send error response:", error);
    return {
      success: false,
      error: "failed_to_send_error",
    };
  }
}

/**
 * Generate validation error response
 */
async function generateValidationErrorResponse(
  userData,
  businessChannel,
  validationResult,
  conversation,
  agentData,
  webhookReceiverNumber = null,
) {
  try {
    // Get current step for retry response
    const currentStep = conversation?.current_step;
    const stepNode = currentStep
      ? await service.getStepNode(agentData.id, currentStep)
      : null;
    let errorMessage =
      validationResult.reason || ERROR_MESSAGES.validation.format;

    // Check if AI takeover is enabled for this step
    if (stepNode?.enable_ai_takeover) {
      logger.info(
        `AI takeover enabled for step ${currentStep}, processing with AI`,
      );

      try {
        // Import AI service functions
        const {
          getPromptByBotName,
          handlingAiResponse,
        } = require("./aiService");

        // Prepare user data context
        const aiUserData = {
          userId: conversation.end_user_id,
          conversationId: conversation.id,
          name: userData?.first_name || "User",
          currentStep: currentStep,
          capturedData: conversation?.metadata?.variables || {},
          repeatCount: conversation.metadata?.numberOfRepeatMsg || 0,
        };

        // Get user's message text from the payload
        // Since this is validation error, we need to get the original message that failed
        const messageBody =
          validationResult.originalInput || userData?.lastMessage || "";

        // Process with AI
        const jsonData = await getPromptByBotName(
          aiUserData,
          stepNode,
          messageBody,
          agentData,
        );

        // Handle AI response
        const aiResponseContent = await handlingAiResponse(
          jsonData,
          aiUserData,
          stepNode,
          {},
        );

        // Track AI takeover event
        const { trackConversationEvent } = require("./analytics");
        await trackConversationEvent(
          conversation.id,
          EVENT_TYPES.AI_PROCESSING_COMPLETED,
          {
            step: currentStep,
            ai_response_type: jsonData?.type,
            confidence: jsonData?.confidence,
            original_input: messageBody,
            source: "webhook_validation_error",
          },
        );

        // Send AI response
        const senderPhoneNumber =
          webhookReceiverNumber || extractSenderPhoneNumber(businessChannel);

        await sendWhatsAppMessage(
          userData,
          aiResponseContent,
          businessChannel,
          senderPhoneNumber,
        );

        logger.info(
          `AI takeover processed successfully for user: ${userData?.userId}`,
          {
            step: currentStep,
            aiResponseType: jsonData?.type,
            confidence: jsonData?.confidence,
          },
        );

        return {
          success: true,
          message: "AI takeover processed successfully",
          aiResponseType: jsonData?.type,
        };
      } catch (aiError) {
        logger.error("AI takeover failed:", aiError);

        // Track AI failure
        const { trackConversationEvent } = require("./analytics");
        await trackConversationEvent(
          conversation.id,
          EVENT_TYPES.AI_PROCESSING_FAILED,
          {
            step: currentStep,
            error: aiError.message,
            source: "webhook_validation_error",
          },
        );

        // Fall back to standard retry response
        logger.info("Falling back to standard validation error response");
      }
    }

    // Generate retry response if step node is available (standard flow or AI fallback)
    if (stepNode) {
      const retryResponse = await generateRetryResponse(
        stepNode,
        errorMessage,
        conversation?.metadata?.variables || {},
      );

      // Use webhook receiver number if available, otherwise fallback to business channel config
      const senderPhoneNumber =
        webhookReceiverNumber || extractSenderPhoneNumber(businessChannel);
      logger.info(
        "generateValidationErrorResponse - Using sender phone number:",
        {
          source: webhookReceiverNumber
            ? "webhook_receiver"
            : "business_channel_config",
          senderPhoneNumber,
          webhookReceiverNumber,
        },
      );

      await sendWhatsAppMessage(
        userData,
        retryResponse,
        businessChannel,
        senderPhoneNumber,
      );
    } else {
      // Fallback error response
      const errorResponse = {
        type: "text",
        text: errorMessage,
      };

      // Use webhook receiver number if available, otherwise fallback to business channel config
      const senderPhoneNumber =
        webhookReceiverNumber || extractSenderPhoneNumber(businessChannel);
      logger.info(
        "generateValidationErrorResponse - Using sender phone number (fallback):",
        {
          source: webhookReceiverNumber
            ? "webhook_receiver"
            : "business_channel_config",
          senderPhoneNumber,
          webhookReceiverNumber,
        },
      );

      await sendWhatsAppMessage(
        userData,
        errorResponse,
        businessChannel,
        senderPhoneNumber,
      );
    }

    return {
      success: false,
      error: "validation_failed",
      message: errorMessage,
    };
  } catch (error) {
    logger.error("Failed to send validation error response:", error);
    return await generateErrorResponse(
      userData,
      businessChannel,
      "general_error",
      error.message,
      webhookReceiverNumber,
    );
  }
}

/**
 * Extract sender phone number from business channel configuration
 * @param {Object} businessChannel - Business channel object
 * @returns {string|null} - Sender phone number or null
 */
function extractSenderPhoneNumber(businessChannel) {
  try {
    if (!businessChannel || !businessChannel.config) {
      logger.warn(
        "No business channel or config provided for sender phone extraction",
      );
      return null;
    }

    const config = businessChannel.config;
    const provider = businessChannel.provider_name;

    logger.debug("Extracting sender phone number", {
      provider,
      configKeys: Object.keys(config),
      senderId: config.sender_id,
      phoneNumbers: config.phone_numbers,
    }); // Priority 1: For Karix provider, prioritize phone_numbers array (webhook business phone)
    if (
      provider === "karix" &&
      config.phone_numbers &&
      Array.isArray(config.phone_numbers)
    ) {
      const phoneNumber =
        config.phone_numbers.find((phone) => phone.is_primary === true) ||
        config.phone_numbers[0];

      const extractedNumber =
        phoneNumber?.number || phoneNumber?.phone_number || phoneNumber?.from;

      if (extractedNumber) {
        logger.info(
          `Using phone number from array (webhook business phone): ${extractedNumber}`,
        );
        return extractedNumber;
      }
    }

    // Priority 2: Use sender_id as fallback (but this might cause "Invalid Sender" errors)
    if (config.sender_id) {
      logger.info(
        `Using sender_id as fallback phone number: ${config.sender_id}`,
      );
      return config.sender_id;
    }

    // Priority 3: Check direct phone_number field
    if (config.phone_number) {
      logger.info(`Using phone_number field: ${config.phone_number}`);
      return config.phone_number;
    }

    // Priority 4: Check 'from' field (sometimes used by providers)
    if (config.from) {
      logger.info(`Using 'from' field: ${config.from}`);
      return config.from;
    }

    // Priority 5: Fallback to first phone number if available
    if (
      config.phone_numbers &&
      Array.isArray(config.phone_numbers) &&
      config.phone_numbers.length > 0
    ) {
      const phoneNumber = config.phone_numbers[0];
      const extractedNumber =
        phoneNumber?.number || phoneNumber?.phone_number || phoneNumber?.from;

      if (extractedNumber) {
        logger.info(`Using fallback phone number: ${extractedNumber}`);
        return extractedNumber;
      }
    }

    logger.error(
      "Could not extract sender phone number from business channel:",
      {
        businessChannelId: businessChannel.id,
        provider: businessChannel.provider_name,
        configKeys: Object.keys(config),
        config: JSON.stringify(config, null, 2),
      },
    );

    return null;
  } catch (error) {
    logger.error("Error extracting sender phone number:", error);
    return null;
  }
}

module.exports = {
  processWebhookFlow,
  webhookRateLimit,
  // Export individual functions for testing
  performUserLookup,
  checkRateLimiting,
  loadConversationAgent,
  validateUserInput,
  performAIProcessing,
  generateConversationResponse,
  personalizeResponse,
  sendResponseMessage,
  extractSenderPhoneNumber,
};
