// api/Webhooks/controller.js
const boom = require("@hapi/boom");
const logger = require("../system/utils/logger");
const service = require("./service");
const { sendWhatsAppMessage } = require("./whatsAppServiceProviders");
const { processWebhookFlow } = require("./webhookFlowManager");

/**
 * Verify Meta webhook during setup
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Promise<string>} - Challenge response
 */
module.exports.verifyMetaWebhook = async (req, res) => {
  try {
    const {
      "hub.mode": mode,
      "hub.verify_token": verifyToken,
      "hub.challenge": challenge,
    } = req.query;

    // Verify token against environment variable
    const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

    if (mode === "subscribe" && verifyToken === expectedToken) {
      logger.info("Meta webhook verified successfully");
      // The response must be the challenge string
      return challenge;
    } else {
      throw boom.unauthorized("Invalid verification token");
    }
  } catch (error) {
    logger.error("Error verifying Meta webhook:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to verify Meta webhook");
  }
};

/**
 * Handle incoming messages agent flow
 * @param {Object} req - Express request
 * @returns {Promise<Object>} - Success response
 */
module.exports.mainAgentFlowController = async (req) => {
  try {
    // Check if the response was already handled by middleware
    if (req.skipResponse) {
      logger.debug(
        "Response already handled by middleware, skipping controller processing",
      );
      return {
        success: true,
        message: "Message processed by comprehensive webhook flow",
      };
    }

    // If no skipResponse flag, process using the comprehensive webhook flow
    if (req.payload) {
      logger.debug("Processing message through comprehensive webhook flow");
      await processWebhookFlow(req, null); // res is null since middleware already handled response
      return {
        success: true,
        message: "Message processed successfully through webhook flow",
      };
    }

    // Fallback to legacy processing if no payload (shouldn't happen with current middleware)
    logger.warn("No payload found, falling back to legacy processing");
    return await legacyMessageProcessing(req);
  } catch (error) {
    logger.error("Error in main agent flow controller:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to process message");
  }
};

/**
 * Legacy message processing (fallback)
 * @param {Object} req - Express request
 * @returns {Promise<Object>} - Success response
 */
async function legacyMessageProcessing(req) {
  try {
    const { messageContent, sender, receiver } = req.payload;
    const { type, text, attachments, messageId } = messageContent;
    const io = req.io;

    // Get message details to extract business channel info
    const messageDetails = await service.getMessageDetails(messageId);
    console.log("messageDetails", messageDetails);

    // Get user data using business channel ID from the stored message
    const userData = await service.getUserData(messageDetails.sender_id);

    // Check if this is a broadcast-initiated conversation first
    let agentData = null;

    // First get conversation using the initial business channel ID
    let existingConversation = await service.getActiveConversation(
      messageDetails.conversation_id,
    );

    // 🔧 FIX: Use business channel from conversation if available to resolve mismatch
    let businessChannel = await service.getBusinessChannel(
      messageDetails?.business_channel_id,
    );

    // Enhanced: Check for active outbound broadcast conversations first
    if (existingConversation?.metadata?.broadcast_type === "outbound") {
      // Use agent mapping from broadcast for outbound broadcasts
      agentData = await service.getAgentFromBroadcastMapping(
        existingConversation.broadcast_id,
        text,
      );
      if (!agentData) {
        logger.info(
          "No agent found for outbound broadcast conversation. Checking for inbound broadcasts...",
        );
      }
      // Set broadcast data in user data for flow processing
      userData.broadcastId = existingConversation.broadcast_id;
      userData.broadcastType = existingConversation?.metadata?.broadcast_type;
    } else {
      console.log("Inbound broadcast conversation detected");
    }
    const payload = {
      type,
      text,
      attachments,
      messageId,
    };

    // Handle different agents - use the correct business channel ID
    let respondPayload = await service.handleDifferentAgents(
      payload,
      existingConversation,
      agentData.id,
      businessChannel,
    );
    console.log("respondPayload", respondPayload);
    // Personalize the response
    respondPayload = await service.personalizeMessage(respondPayload, userData);
    console.log("respondPayload", respondPayload);

    // Send WhatsApp message using the receiver as sender (webhook business phone)
    // This is the actual configured number that can send messages via Karix
    await sendWhatsAppMessage(
      userData,
      respondPayload,
      businessChannel,
      receiver, // Use webhook business phone as sender
    );

    // Emit message to socket
    if (io) {
      service.messageEmitterToSocket(io, userData?.userId, {
        message: "success",
        userId: userData?.userId,
        userData,
        messageContent: respondPayload,
        role: "justping",
      });
    }

    return {
      success: true,
      message: "Message processed successfully",
    };
  } catch (error) {
    logger.error("Error handling message:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to process message");
  }
}
