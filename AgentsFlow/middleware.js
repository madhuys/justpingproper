// api/Webhooks/middleware.js
const logger = require("../system/utils/logger");
const MessageEventService = require("../api/MessageEvents/service");
const { processWebhookFlow } = require("./webhookFlowManager");

/**
 * Process webhook events from Karix
 * @param {Object} options - Configuration options
 * @param {string} options.businessId - Business ID to use for this webhook
 * @returns {Function} Express middleware function
 */
const karixMiddleware = (options = {}) => {
  return async (req, res, next) => {
    const message = req?.body;
    req.io = req.app.locals.io;

    // Set business ID from options if provided
    if (options.businessId) {
      req.businessId = options.businessId;
    }

    // Always respond 200 OK to acknowledge receipt
    if (!res.headersSent) {
      res.status(200).end();
    }
    try {
      const eventType = message?.events?.eventType;

      // Handle delivery events
      if (eventType === "DELIVERY EVENTS") {
        await handleKarixDeliveryEvent(message);
        return;
      } // Handle user messages
      if (eventType === "User initiated") {
        await handleKarixUserMessage(req, message);

        // Process through the comprehensive webhook flow
        if (req.payload) {
          await processWebhookFlow(req, res);
        }

        // Mark response as sent to prevent double responses
        req.skipResponse = true;
        return next();
      }
    } catch (error) {
      logger.error("Error processing Karix webhook:", error);
    }
  };
};

/**
 * Process webhook events from Meta (WhatsApp)
 * @param {Object} options - Configuration options
 * @param {string} options.businessId - Business ID to use for this webhook
 * @returns {Function} Express middleware function
 */
const metaMiddleware = (options = {}) => {
  return async (req, res, next) => {
    const body = req.body;

    // Set business ID from options if provided
    if (options.businessId) {
      req.businessId = options.businessId;
    }

    // Always respond 200 OK to acknowledge receipt
    if (!res.headersSent) {
      res.status(200).end();
    }
    try {
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      const messages = value?.messages;
      const statuses = value?.statuses;

      // Handle status updates
      if (statuses) {
        await handleMetaStatusUpdate(value, statuses[0]);
        return;
      } // Handle incoming messages
      if (messages) {
        await handleMetaMessage(req, value, messages[0]);

        // Process through the comprehensive webhook flow
        if (req.payload) {
          await processWebhookFlow(req, res);
        }

        // Mark response as sent to prevent double responses
        req.skipResponse = true;
        return next();
      }
    } catch (error) {
      logger.error("Error processing Meta webhook:", error);
    }
  };
};

/**
 * Handle Karix delivery events
 * @param {Object} message - Karix message data
 */
async function handleKarixDeliveryEvent(message) {
  const deliveryData = {
    provider: "karix",
    messageId: message?.events?.mid,
    status: message?.notificationAttributes?.status,
    reason: message?.notificationAttributes?.reason,
    errorCode: message?.notificationAttributes?.code,
    recipient: {
      phone: message?.recipient?.to, // Customer's phone
    },
    sender: {
      phone: message?.sender?.from, // Business phone number
    },
    timestamp: message?.events?.timestamp,
    metadata: {
      conversationId: message?.recipient?.reference?.conversationId,
      raw: message, // Store the raw message for debugging/reference
    },
  };

  await MessageEventService.storeMessageStatus(deliveryData);
  logger.debug(
    `Stored Karix delivery status: ${deliveryData.status} for message ${deliveryData.messageId}`,
  );
}

/**
 * Handle Karix user message
 * @param {Object} req - Express request
 * @param {Object} message - Karix message data
 */
async function handleKarixUserMessage(req, message) {
  const msg = message?.eventContent?.message;
  const contentType = msg?.contentType;

  // Extract message content based on type
  let extractedText = null;
  let attachments = null;

  switch (contentType) {
    case "text":
      extractedText = msg?.text?.body;
      break;
    case "interactive":
      extractedText =
        msg?.interactive?.list_reply?.title ||
        msg?.interactive?.button_reply?.title;
      break;
    case "ATTACHMENT":
      extractedText = msg?.attachmentType || "attachment received";
      attachments = {
        type: msg?.attachmentType,
        url: msg?.attachmentUrl,
        mime_type: msg?.attachmentMimeType,
        filename: msg?.attachmentFilename,
      };
      break;
    default:
      extractedText = "Unsupported message type";
  }
  const messageData = {
    provider: "karix",
    type: contentType,
    text: extractedText,
    attachments: attachments,
    content: { contentType, text: extractedText, attachments },
    sender: {
      phone: msg?.from, // Customer's phone
      name: "", // Add logic to fetch name if needed
    },
    recipient: {
      phone: msg?.to, // Business phone number
    },
    timestamp: new Date().toISOString(),
    metadata: {
      raw: message, // Store the raw message for debugging/reference
    },
  };
  // Store the incoming message
  const storedMessage = await MessageEventService.storeIncomingMessage(
    messageData,
    req.businessId, // Pass business ID if available
  );

  logger.info("Karix webhook processing", {
    customerPhone: msg?.from,
    businessPhone: msg?.to,
    messageType: contentType,
    extractedText: extractedText?.substring(0, 100),
  });

  // Attach payload to req for further processing
  req.payload = {
    messageContent: {
      type: contentType,
      text: extractedText,
      attachments: attachments,
      messageId: storedMessage.id,
    },
    sender: messageData.sender,
    receiver: messageData.recipient.phone, // This is the business phone (msg?.to)
    service: "karix",
    // Add webhook flow context
    webhookContext: {
      provider: "karix",
      businessId: req.businessId,
      rawMessage: message,
      storedMessageId: storedMessage.id,
      processedAt: new Date().toISOString(),
    },
  };
}

/**
 * Handle Meta status updates
 * @param {Object} value - Meta message value data
 * @param {Object} statusData - Meta status data
 */
async function handleMetaStatusUpdate(value, statusData) {
  const statusPayload = {
    provider: "meta",
    messageId: statusData?.id,
    status: statusData?.status,
    timestamp: statusData?.timestamp,
    recipient: {
      phone: statusData?.recipient_id, // Customer's phone
    },
    sender: {
      phone: value?.metadata?.display_phone_number, // Business phone number
    },
    metadata: {
      conversationId: statusData?.conversation?.id,
      pricing: statusData?.pricing,
      errors: statusData?.errors || [],
      raw: statusData, // Store the raw status data for debugging/reference
    },
  };

  await MessageEventService.storeMessageStatus(statusPayload);
  logger.debug(
    `Stored Meta delivery status: ${statusPayload.status} for message ${statusPayload.messageId}`,
  );
}

/**
 * Handle Meta messages
 * @param {Object} req - Express request
 * @param {Object} value - Meta message value data
 * @param {Object} msg - Meta message data
 */
async function handleMetaMessage(req, value, msg) {
  const contact = value?.contacts?.[0];

  let extractedText = null;
  let attachments = null;

  switch (msg?.type) {
    case "text":
      extractedText = msg?.text?.body;
      break;
    case "image":
      extractedText = msg?.image?.caption || "Image received";
      attachments = msg?.image;
      break;
    case "sticker":
      extractedText = "Sticker received";
      attachments = msg?.sticker;
      break;
    case "location":
      extractedText = "Location shared";
      attachments = msg?.location;
      break;
    case "reaction":
      extractedText = `Reacted with ${msg?.reaction?.emoji}`;
      attachments = msg?.reaction;
      break;
    case "contacts":
      extractedText = "Contact shared";
      attachments = msg?.contacts;
      break;
    case "interactive":
      const interactiveType = msg?.interactive?.type;
      if (interactiveType === "button_reply") {
        extractedText = msg?.interactive?.button_reply?.title;
      } else if (interactiveType === "list_reply") {
        extractedText = msg?.interactive?.list_reply?.title;
      } else {
        extractedText = "Interactive response received";
      }
      break;
    case "order":
      extractedText = "Order placed";
      attachments = msg?.order;
      break;
    case "system":
      extractedText = msg?.system?.body || "System message";
      attachments = msg?.system;
      break;
    default:
      extractedText = "Unsupported message type";
  }
  const messageData = {
    provider: "meta",
    type: msg?.type,
    text: extractedText,
    attachments: attachments,
    sender: {
      phone: msg?.from, // Customer's phone
      name: contact?.profile?.name || "",
    },
    recipient: {
      phone: value?.metadata?.display_phone_number, // Business phone number
    },
    timestamp: msg?.timestamp || new Date().toISOString(),
    metadata: {
      raw: msg, // Store the raw message for debugging/reference
    },
  };

  // Store the incoming message
  const storedMessage = await MessageEventService.storeIncomingMessage(
    messageData,
    req.businessId, // Pass business ID if available
  );
  // Attach payload to req for further processing
  req.payload = {
    payload: {
      type: msg?.type,
      text: extractedText,
      attachments: attachments,
      messageId: storedMessage.id,
    },
    sender: messageData.sender,
    receiver: messageData.recipient.phone,
    service: "meta",
    // Add webhook flow context
    webhookContext: {
      provider: "meta",
      businessId: req.businessId,
      rawMessage: msg,
      valueData: value,
      storedMessageId: storedMessage.id,
      processedAt: new Date().toISOString(),
    },
  };
}

module.exports = { karixMiddleware, metaMiddleware };
