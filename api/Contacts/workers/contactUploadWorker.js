/**
 * Contact Upload Worker
 *
 * This worker processes contact upload files from the Azure Storage Queue.
 * It reads messages from the queue, processes the files, and updates the upload status.
 */

require("dotenv").config(); // Load environment variables
const AzureQueueStorageService = require("../../../system/services/Azure/queue");
const contactsService = require("../service");
const logger = require("../../../system/utils/logger");

// Initialize Azure Queue
const queueService = new AzureQueueStorageService({
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
});

// Queue name for contact uploads
const CONTACT_UPLOAD_QUEUE = process.env.AZURE_CONTACT_QUEUE_NAME;

// Configuration
const CONFIG = {
  visibilityTimeout: 600, // 10 minutes - longer timeout for large files
  pollingInterval: 5000, // 5 seconds between polls when queue is empty
  errorRetryInterval: 30000, // 30 seconds between retries after error
  maxRetries: 1, // Maximum retries for a single message
  maxConcurrentProcessing: 1, // Process one message at a time (can be increased)
  shutdownGracePeriod: 5000, // 5 seconds to gracefully shutdown
};

// Track active processing
let isProcessing = false;
let shutdownRequested = false;

/**
 * Process a single message from the queue
 * @param {Object} message - Queue message
 * @returns {Promise<boolean>} - Success status
 */
async function processMessage(message) {
  try {
    logger.info(`Processing message: ${message.messageId}`);

    const { uploadId, businessId, filePath, contactGroupId } = message.body;

    if (!uploadId) {
      logger.error("Invalid message format. Missing uploadId.");
      return false;
    }

    if (!filePath) {
      logger.error(
        `Invalid message format for upload ${uploadId}. Missing filePath.`
      );
      return false;
    }

    logger.info(
      `Processing contact upload ${uploadId} for business ${
        businessId || "unknown"
      }`
    );

    // Process the contact upload
    await contactsService.processContactUpload(
      uploadId,
      filePath,
      contactGroupId
    );

    logger.info(`Successfully processed contact upload ${uploadId}`);
    return true;
  } catch (error) {
    logger.error(`Error processing message: ${error.message}`, error);
    return false;
  }
}

/**
 * Delete a message from the queue
 * @param {Object} message - Queue message
 * @returns {Promise<boolean>} - Success status
 */
async function deleteMessage(message) {
  try {
    const result = await queueService.deleteMessage({
      queueName: CONTACT_UPLOAD_QUEUE,
      messageId: message.messageId,
      popReceipt: message.popReceipt,
    });

    if (result.success) {
      logger.info(`Deleted message ${message.messageId} from queue`);
      return true;
    } else {
      logger.error(
        `Failed to delete message ${message.messageId}: ${result.error}`
      );
      return false;
    }
  } catch (error) {
    logger.error(
      `Error deleting message ${message.messageId}: ${error.message}`,
      error
    );
    return false;
  }
}

/**
 * Update message visibility timeout (to extend processing time)
 * @param {Object} message - Queue message
 * @param {number} visibilityTimeout - New visibility timeout in seconds
 * @returns {Promise<Object|null>} - Updated message or null if failed
 */
async function updateMessageVisibility(message, visibilityTimeout) {
  try {
    const result = await queueService.updateMessage({
      queueName: CONTACT_UPLOAD_QUEUE,
      messageId: message.messageId,
      popReceipt: message.popReceipt,
      message: message.body, // Keep the same message content
      visibilityTimeout: visibilityTimeout,
    });

    if (result.success) {
      logger.debug(
        `Updated message ${message.messageId} visibility to ${visibilityTimeout} seconds`
      );
      return {
        ...message,
        popReceipt: result.popReceipt,
      };
    } else {
      logger.error(`Failed to update message visibility: ${result.error}`);
      return null;
    }
  } catch (error) {
    logger.error(`Error updating message visibility: ${error.message}`, error);
    return null;
  }
}

/**
 * Process the next message from the queue
 * @returns {Promise<void>}
 */
async function processNextMessage() {
  if (isProcessing || shutdownRequested) {
    return;
  }

  isProcessing = true;
  try {
    console.log("Processing next message...");

    // Get queue messages
    const result = await queueService.receiveMessages({
      queueName: CONTACT_UPLOAD_QUEUE,
      maxMessages: 1,
      visibilityTimeout: CONFIG.visibilityTimeout,
      parseJson: true,
    });
    console.log("result", result);

    if (!result.success) {
      logger.error(`Error receiving messages: ${result.error}`);
      return;
    }

    if (result.messages && result.messages.length > 0) {
      const message = result.messages[0];

      // Process the message
      const success = await processMessage(message);

      // Delete the message from the queue if processed successfully
      if (success) {
        await deleteMessage(message);
      } else {
        // If processing failed, we can either:
        // 1. Delete the message (if it's malformed)
        // 2. Update visibility to make it visible again after some delay (for retrying)
        // 3. Move to a dead-letter queue (not implemented here)

        // Check dequeue count to avoid infinite retries
        if (message.dequeueCount >= CONFIG.maxRetries) {
          logger.warn(
            `Message ${message.messageId} exceeded max retries (${CONFIG.maxRetries}). Deleting.`
          );
          await deleteMessage(message);
        } else {
          // Make the message visible again after a short delay for retry
          await updateMessageVisibility(message, 30); // 30 seconds visibility timeout
          logger.info(
            `Message ${message.messageId} will be retried (attempt ${message.dequeueCount})`
          );
        }
      }
    } else {
      // No messages, wait before polling again
      logger.debug("No messages in queue. Waiting before next poll...");
    }
  } catch (error) {
    logger.error(`Error in processNextMessage: ${error.message}`, error);
  } finally {
    isProcessing = false;
  }
}

/**
 * Main worker function that polls the queue for messages
 */
async function worker() {
  try {
    logger.info("Contact Upload Worker started");

    logger.info(`Connected to queue: ${CONTACT_UPLOAD_QUEUE}`);

    // Setup graceful shutdown
    setupGracefulShutdown();

    // Main processing loop
    while (!shutdownRequested) {
      try {
        await processNextMessage();
      } catch (error) {
        logger.error(`Error in worker loop: ${error.message}`, error);
        // Wait longer before retrying after error
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.errorRetryInterval)
        );
      }
    }

    logger.info("Worker shutdown requested, stopping gracefully...");
  } catch (error) {
    logger.error(`Fatal error in worker: ${error.message}`, error);
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown() {
  // Handle process termination signals
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Promise Rejection:", reason);
  });
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", error);
    gracefulShutdown("uncaughtException");
  });
}

/**
 * Gracefully shutdown the worker
 * @param {string} signal - Signal that triggered the shutdown
 */
function gracefulShutdown(signal) {
  logger.info(`${signal} received, initiating graceful shutdown...`);

  shutdownRequested = true;

  // Give active processing some time to complete
  setTimeout(() => {
    logger.info("Shutdown complete, exiting process");
    process.exit(0);
  }, CONFIG.shutdownGracePeriod);
}

// Start the worker if this file is run directly
if (require.main === module) {
  worker().catch((error) => {
    logger.error(`Unhandled error in worker: ${error.message}`, error);
    process.exit(1);
  });
}

module.exports = {
  worker,
  processMessage,
  CONFIG, // Export config for testing
};
