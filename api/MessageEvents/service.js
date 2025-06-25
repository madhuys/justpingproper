// system/services/MessageEvent/index.js
const EndUser = require("../../system/models/EndUser");
const BusinessChannel = require("../../system/models/BusinessChannel");
const Conversation = require("../../system/models/Conversation");
const Message = require("../../system/models/Message");
const MessageStatus = require("../../system/models/MessageStatus");
const logger = require("../../system/utils/logger");
const { transaction } = require("../../system/db/database");
const {
  createPhoneQueryVariations,
  normalizePhoneNumber,
} = require("../../system/utils/phoneNormalization");

/**
 * Service for handling message events and storing them in the database
 */
class MessageEventService {
  /**
   * Find or create a conversation for incoming messages
   * @param {string} endUserId - End user ID
   * @param {string} businessChannelId - Business channel ID
   * @param {string} businessId - Business ID
   * @param {Object} trx - Transaction object
   * @returns {Promise<Object>} Conversation record
   */ static async findConversation(
    endUserId,
    businessChannelId,
    businessId,
    trx,
  ) {
    try {
      // First, prioritize finding existing broadcast conversations
      let conversation = await Conversation.query(trx)
        .where("end_user_id", endUserId)
        .where("business_channel_id", businessChannelId)
        .where("business_id", businessId)
        .whereIn("status", ["active", "pending"])
        .whereNotNull("broadcast_id") // Prioritize broadcast conversations
        .orderBy("updated_at", "desc")
        .first();

      return conversation;
    } catch (error) {
      logger.error(
        `Error finding/creating conversation for end user ${endUserId} and business channel ${businessChannelId}:`,
        error,
      );
      throw error;
    }
  }
  /**
   * Store an incoming message from a webhook
   * @param {Object} messageData - Incoming message data
   * @param {string} overrideBusinessId - Optional business ID to force a specific business context
   * @returns {Promise<Object>} Stored message record
   */
  static async storeIncomingMessage(messageData, overrideBusinessId = null) {
    return await transaction(async (trx) => {
      try {
        // Find the business channel by phone number
        const businessChannel = await this.findBusinessChannel(
          messageData.recipient.phone,
          messageData.provider,
          overrideBusinessId,
          trx,
        );

        if (!businessChannel) {
          throw new Error(
            `Business channel not found for ${messageData.recipient.phone} with provider ${messageData.provider}`,
          );
        }

        // Find or create the end user (contact) with business channel
        const endUser = await this.findEndUser(
          messageData.sender.phone,
          businessChannel.business_id,
          trx,
        );
        if (!endUser) {
          logger.error(
            `End user not found for ${messageData.sender.phone} with business ${businessChannel.business_id}`,
          );
          return;
        }

        // Find or create conversation for this end user and business channel
        const conversation = await this.findConversation(
          endUser.id,
          businessChannel.id,
          businessChannel.business_id,
          trx,
        );
        if (!conversation) {
          logger.error(
            `Conversation not found for end user ${endUser.id} and business channel ${businessChannel.id}`,
          );
          return;
        }

        // Create the message record with required fields
        const message = await Message.query(trx).insert({
          conversation_id: conversation.id, // Required field
          sender_type: "end_user", // Required field - incoming messages are from end users
          sender_id: endUser.id, // Required field - the end user who sent the message
          content: messageData?.content,
          content_type: "text",
          metadata: {
            provider: messageData.provider,
            provider_message_id: messageData.messageId,
            attachments: messageData.attachments,
            timestamp: messageData.timestamp,
            ...messageData.metadata,
          },
          is_internal: false,
          created_at: messageData.timestamp || new Date().toISOString(),
        });

        // Update conversation with last message timestamp
        await Conversation.query(trx).patchAndFetchById(conversation.id, {
          last_message_at: message.created_at,
          updated_at: new Date().toISOString(),
        });

        logger.info(
          `Stored incoming message from ${endUser.phone} to business channel ${businessChannel.id} in conversation ${conversation.id}`,
        );

        return message;
      } catch (error) {
        logger.error("Error storing incoming message:", error);
        throw error;
      }
    });
  }

  /**
   * Store an outgoing message
   * @param {Object} messageData - Outgoing message data
   * @returns {Promise<Object>} Stored message record
   */
  static async storeOutgoingMessage(messageData) {
    return await transaction(async (trx) => {
      try {
        // Find the business channel
        const businessChannel = await BusinessChannel.query(trx).findById(
          messageData.business_channel_id,
        );

        if (!businessChannel) {
          throw new Error(
            `Business channel not found with ID ${messageData.business_channel_id}`,
          );
        }

        // Find the end user
        const endUser = await EndUser.query(trx).findById(
          messageData.end_user_id,
        );

        if (!endUser) {
          throw new Error(
            `End user not found with ID ${messageData.end_user_id}`,
          );
        }

        // Create the message record
        const message = await Message.query(trx).insert({
          end_user_id: endUser.id,
          business_channel_id: businessChannel.id,
          message_type: messageData.message_type,
          direction: "outgoing",
          message_content: messageData.message_content,
          provider: businessChannel.provider_name,
          provider_message_id: messageData.provider_message_id,
          status: "pending",
          template_id: messageData.template_id,
          broadcast_id: messageData.broadcast_id,
          conversation_id: messageData.conversation_id,
          metadata: messageData.metadata || {},
        });

        logger.info(
          `Stored outgoing message to ${endUser.phone} from business channel ${businessChannel.id}`,
        );

        return message;
      } catch (error) {
        logger.error("Error storing outgoing message:", error);
        throw error;
      }
    });
  }

  /**
   * Store a message status update from a webhook
   * @param {Object} statusData - Status data
   * @returns {Promise<Object>} Stored status record
   */
  static async storeMessageStatus(statusData) {
    return await transaction(async (trx) => {
      try {
        // Find the business channel
        const businessChannel = await this.findBusinessChannel(
          statusData.sender.phone,
          statusData.provider,
          trx,
        );

        if (!businessChannel) {
          throw new Error(
            `Business channel not found for ${statusData.sender.phone} with provider ${statusData.provider}`,
          );
        }

        // Find the end user
        let endUser = null;
        if (statusData.recipient?.phone) {
          endUser = await EndUser.query(trx)
            .where("phone", statusData.recipient.phone)
            .where("business_id", businessChannel.business_id) // Query by business_id
            .first();
        }

        // Create the status record
        const statusRecord = await MessageStatus.query(trx).insert({
          provider_message_id: statusData.messageId,
          business_channel_id: businessChannel.id,
          end_user_id: endUser?.id,
          status: statusData.status,
          reason: statusData.reason || null,
          error_code: statusData.errorCode || null,
          timestamp: statusData.timestamp
            ? new Date(parseInt(statusData.timestamp)).toISOString()
            : new Date().toISOString(),
          provider: statusData.provider,
          metadata: statusData.metadata || {},
        });

        // If we have a related message, update its status
        if (statusData.messageId) {
          const message = await Message.query(trx)
            .where("provider_message_id", statusData.messageId)
            .first();

          if (message) {
            // Map webhook status to our status
            const statusMap = {
              sent: "sent",
              delivered: "delivered",
              read: "read",
              failed: "failed",
            };

            // Get the mapped status or use the original
            const newStatus =
              statusMap[statusData.status.toLowerCase()] || statusData.status;

            // Update appropriate timestamp based on status
            const updates = {
              status: newStatus,
              updated_at: new Date().toISOString(),
            };

            if (newStatus === "delivered") {
              updates.delivered_at = statusData.timestamp
                ? new Date(parseInt(statusData.timestamp)).toISOString()
                : new Date().toISOString();
            } else if (newStatus === "read") {
              updates.read_at = statusData.timestamp
                ? new Date(parseInt(statusData.timestamp)).toISOString()
                : new Date().toISOString();
            } else if (newStatus === "failed") {
              updates.error_message =
                statusData.reason || "Message delivery failed";
            }

            await Message.query(trx).patchAndFetchById(message.id, updates);
          }
        }

        logger.info(
          `Stored message status update: ${statusData.status} for message ${statusData.messageId}`,
        );

        return statusRecord;
      } catch (error) {
        logger.error("Error storing message status:", error);
        throw error;
      }
    });
  }
  /**
   * Find or create an end user by phone number and business channel
   * @param {string} phone - Phone number
   * @param {string} businessChannelId - Business channel ID
   * @param {string} businessId - Business ID
   * @param {string} name - Contact name (optional)
   * @param {Object} trx - Transaction object
   * @returns {Promise<Object>} End user record
   */
  static async findOrCreateEndUser(
    phone,
    businessChannelId,
    businessId, // This is the business_id from the businessChannel
    name,
    trx,
  ) {
    try {
      // Use centralized phone normalization for user lookup
      const phoneVariations = createPhoneQueryVariations(phone);

      logger.info(`Looking for end user with phone variations:`, {
        originalPhone: phone,
        businessId,
        variations: phoneVariations,
      });

      // Try to find the end user by phone variations and business_id
      let endUser = await EndUser.query(trx)
        .where("business_id", businessId)
        .where((builder) => {
          phoneVariations.forEach((phoneVar) => {
            builder.orWhere("phone", phoneVar);
          });
        })
        .first();

      // If end user doesn't exist, create a new one with normalized phone
      if (!endUser) {
        // Normalize the phone number for storage
        const normalized = normalizePhoneNumber(phone);

        // Use normalized phone for storage, but keep original if normalization fails
        const phoneToStore = normalized.isValid ? normalized.e164 : phone;
        const countryCodeToStore = normalized.isValid
          ? normalized.countryCode
          : null;

        endUser = await EndUser.query(trx).insert({
          phone: phoneToStore,
          country_code: countryCodeToStore,
          first_name: name || null,
          business_id: businessId, // Use businessId from the businessChannel
          source_type: "webhook",
          channel_identifiers: {
            phone: phoneToStore,
          },
          metadata: {
            created_from: "webhook",
            creation_date: new Date().toISOString(),
            original_phone: phone, // Keep track of original format
          },
        });

        logger.info(
          `Created new end user with normalized phone ${phoneToStore} (original: ${phone}) for business channel ${businessChannelId}`,
        );
      }
      // Update the name if provided and different from existing
      else if (name && name !== endUser.first_name) {
        endUser = await EndUser.query(trx).patchAndFetchById(endUser.id, {
          first_name: name,
          updated_at: new Date().toISOString(),
        });

        logger.info(`Updated end user name for ${phone} -> ${endUser.phone}`);
      }

      return endUser;
    } catch (error) {
      logger.error(
        `Error finding/creating end user with phone ${phone}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find or create an end user by phone number and business channel
   * @param {string} phone - Phone number
   * @param {string} businessChannelId - Business channel ID
   * @param {string} businessId - Business ID
   * @param {string} name - Contact name (optional)
   * @param {Object} trx - Transaction object
   * @returns {Promise<Object>} End user record
   */
  static async findEndUser(
    phone,
    businessId, // This is the business_id from the businessChannel
    trx,
  ) {
    try {
      // Use centralized phone normalization for user lookup
      const phoneVariations = createPhoneQueryVariations(phone);

      logger.info(`Looking for end user with phone variations:`, {
        originalPhone: phone,
        businessId,
        variations: phoneVariations,
      });

      // Try to find the end user by phone variations and business_id
      let endUser = await EndUser.query(trx)
        .where("business_id", businessId)
        .where((builder) => {
          phoneVariations.forEach((phoneVar) => {
            builder.orWhere("phone", phoneVar);
          });
        })
        .first();

      return endUser;
    } catch (error) {
      logger.error(
        `Error finding/creating end user with phone ${phone}:`,
        error,
      );
      throw error;
    }
  }
  /**
   * Find a business channel by phone number and provider
   * @param {string} phone - Phone number (with or without country code)
   * @param {string} provider - Provider name (e.g., 'karix', 'meta')
   * @param {Object} trx - Transaction object
   * @returns {Promise<Object>} Business channel record
   */ static async findBusinessChannel(phone, provider, businessId, trx) {
    try {
      // Use centralized phone normalization utility
      const phoneVariations = createPhoneQueryVariations(phone);

      // Build the query with proper logic
      let query = BusinessChannel.query(trx);

      // Filter by business_id if provided
      if (businessId) {
        query = query.where("business_id", businessId);
      }

      // Filter by provider
      query = query.where((builder) => {
        builder
          .where("provider_name", provider)
          .orWhere("provider_id", provider);
      });

      // Filter by phone number variations
      query = query.where((builder) => {
        phoneVariations.forEach((phoneVar, index) => {
          if (index === 0) {
            // First variation uses 'where' instead of 'orWhere'
            builder
              .whereRaw("config->>'phone' = ?", [phoneVar])
              .orWhereRaw("config->>'phoneNumber' = ?", [phoneVar])
              .orWhereRaw("config->>'from' = ?", [phoneVar])
              .orWhereRaw(
                "EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(config->'phone_numbers', '[]'::jsonb)) AS elem WHERE elem->>'phone_number' = ?)",
                [phoneVar],
              );
          } else {
            // Subsequent variations use 'orWhere'
            builder
              .orWhereRaw("config->>'phone' = ?", [phoneVar])
              .orWhereRaw("config->>'phoneNumber' = ?", [phoneVar])
              .orWhereRaw("config->>'from' = ?", [phoneVar])
              .orWhereRaw(
                "EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(config->'phone_numbers', '[]'::jsonb)) AS elem WHERE elem->>'phone_number' = ?)",
                [phoneVar],
              );
          }
        });
      });

      const businessChannel = await query.first();

      return businessChannel;
    } catch (error) {
      logger.error(
        `Error finding business channel for phone ${phone} and provider ${provider}:`,
        error,
      );
      throw error;
    }
  }
}

module.exports = MessageEventService;
