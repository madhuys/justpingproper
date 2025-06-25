const {
  QueueServiceClient,
  StorageSharedKeyCredential,
} = require("@azure/storage-queue");

/**
 * Azure Queue Storage Service for message queue operations
 */
class AzureQueueStorageService {
  /**
   * Initialize the Queue Storage Service
   * @param {Object} config - Configuration
   * @param {string} config.accountName - Storage account name
   * @param {string} config.accountKey - Storage account key
   * @param {string} [config.connectionString] - Or use connection string instead
   */
  constructor(config) {
    if (config.connectionString) {
      this.queueServiceClient = QueueServiceClient.fromConnectionString(
        config.connectionString
      );
    } else {
      const sharedKeyCredential = new StorageSharedKeyCredential(
        config.accountName,
        config.accountKey
      );

      const queueUrl = `https://${config.accountName}.queue.core.windows.net`;
      this.queueServiceClient = new QueueServiceClient(
        queueUrl,
        sharedKeyCredential
      );
    }
  }

  /**
   * Create a new queue if it doesn't exist
   * @param {string} queueName - Queue name
   * @returns {Promise<Object>} - Operation result
   */
  async createQueue(queueName) {
    try {
      const queueClient = this.queueServiceClient.getQueueClient(queueName);
      const createResponse = await queueClient.create();

      return {
        success: true,
        queueName,
        created: createResponse.succeeded,
        response: createResponse,
      };
    } catch (error) {
      // If queue already exists, don't treat as error
      if (error.statusCode === 409) {
        return {
          success: true,
          queueName,
          created: false,
          alreadyExists: true,
        };
      }

      console.error("Error creating queue:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete a queue
   * @param {string} queueName - Queue name
   * @returns {Promise<Object>} - Operation result
   */
  async deleteQueue(queueName) {
    try {
      const queueClient = this.queueServiceClient.getQueueClient(queueName);
      const deleteResponse = await queueClient.delete();

      return {
        success: true,
        queueName,
        response: deleteResponse,
      };
    } catch (error) {
      console.error("Error deleting queue:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * List all queues in the storage account
   * @param {Object} [options] - List options
   * @param {string} [options.prefix] - Filter by name prefix
   * @returns {Promise<Object>} - List of queues
   */
  async listQueues(options = {}) {
    try {
      const queues = [];
      const listOptions = {};

      if (options.prefix) {
        listOptions.prefix = options.prefix;
      }

      const iterator = this.queueServiceClient.listQueues(listOptions);
      let queueItem = await iterator.next();

      while (!queueItem.done) {
        queues.push({
          name: queueItem.value.name,
          metadata: queueItem.value.metadata,
        });

        queueItem = await iterator.next();
      }

      return {
        success: true,
        queues,
      };
    } catch (error) {
      console.error("Error listing queues:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send a message to a queue
   * @param {Object} options - Message options
   * @param {string} options.queueName - Queue name
   * @param {string|Object} options.message - Message content (string or object to be JSON stringified)
   * @param {number} [options.visibilityTimeout] - Visibility timeout in seconds
   * @param {number} [options.timeToLive] - Time to live in seconds
   * @returns {Promise<Object>} - Operation result
   */
  async sendMessage({
    queueName,
    message,
    visibilityTimeout = 0,
    timeToLive = 604800, // 7 days (maximum allowed)
  }) {
    try {
      // Create queue if it doesn't exist
      await this.createQueue(queueName);

      const queueClient = this.queueServiceClient.getQueueClient(queueName);

      // Convert message to string if it's an object
      const messageContent =
        typeof message === "object" ? JSON.stringify(message) : message;

      // Send message
      const sendResponse = await queueClient.sendMessage(
        Buffer.from(messageContent).toString("base64"),
        {
          visibilityTimeout,
          messageTimeToLive: timeToLive,
        }
      );

      return {
        success: true,
        messageId: sendResponse.messageId,
        insertedOn: sendResponse.insertedOn,
        expiresOn: sendResponse.expiresOn,
        popReceipt: sendResponse.popReceipt,
        response: sendResponse,
      };
    } catch (error) {
      console.error("Error sending message:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Receive messages from a queue
   * @param {Object} options - Receive options
   * @param {string} options.queueName - Queue name
   * @param {number} [options.maxMessages] - Maximum number of messages to receive (1-32)
   * @param {number} [options.visibilityTimeout] - Visibility timeout in seconds
   * @param {boolean} [options.parseJson] - Attempt to parse message as JSON
   * @returns {Promise<Object>} - Retrieved messages
   */
  async receiveMessages({
    queueName,
    maxMessages = 1,
    visibilityTimeout = 30,
    parseJson = true,
  }) {
    try {
      const queueClient = this.queueServiceClient.getQueueClient(queueName);

      // Receive messages
      const receiveResponse = await queueClient.receiveMessages({
        numberOfMessages: Math.min(32, Math.max(1, maxMessages)),
        visibilityTimeout,
      });

      // Process and parse messages
      const messages = receiveResponse.receivedMessageItems.map((message) => {
        // Decode message text from base64
        const decodedText = Buffer.from(
          message.messageText,
          "base64"
        ).toString();

        // Try to parse as JSON if requested
        let parsedBody = decodedText;
        if (parseJson) {
          try {
            parsedBody = JSON.parse(decodedText);
          } catch (e) {
            // If parsing fails, use the original text
            parsedBody = decodedText;
          }
        }

        return {
          messageId: message.messageId,
          insertedOn: message.insertedOn,
          expiresOn: message.expiresOn,
          popReceipt: message.popReceipt,
          dequeueCount: message.dequeueCount,
          body: parsedBody,
          rawText: decodedText,
        };
      });

      return {
        success: true,
        messages,
        count: messages.length,
      };
    } catch (error) {
      console.error("Error receiving messages:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Peek messages from a queue without removing them
   * @param {Object} options - Peek options
   * @param {string} options.queueName - Queue name
   * @param {number} [options.maxMessages] - Maximum number of messages to peek (1-32)
   * @param {boolean} [options.parseJson] - Attempt to parse message as JSON
   * @returns {Promise<Object>} - Peeked messages
   */
  async peekMessages({ queueName, maxMessages = 1, parseJson = true }) {
    try {
      const queueClient = this.queueServiceClient.getQueueClient(queueName);

      // Peek messages
      const peekResponse = await queueClient.peekMessages({
        numberOfMessages: Math.min(32, Math.max(1, maxMessages)),
      });

      // Process and parse messages
      const messages = peekResponse.peekedMessageItems.map((message) => {
        // Decode message text from base64
        const decodedText = Buffer.from(
          message.messageText,
          "base64"
        ).toString();

        // Try to parse as JSON if requested
        let parsedBody = decodedText;
        if (parseJson) {
          try {
            parsedBody = JSON.parse(decodedText);
          } catch (e) {
            // If parsing fails, use the original text
            parsedBody = decodedText;
          }
        }

        return {
          messageId: message.messageId,
          insertedOn: message.insertedOn,
          expiresOn: message.expiresOn,
          dequeueCount: message.dequeueCount,
          body: parsedBody,
          rawText: decodedText,
        };
      });

      return {
        success: true,
        messages,
        count: messages.length,
      };
    } catch (error) {
      console.error("Error peeking messages:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete a message from a queue
   * @param {Object} options - Delete options
   * @param {string} options.queueName - Queue name
   * @param {string} options.messageId - Message ID
   * @param {string} options.popReceipt - Pop receipt from receive operation
   * @returns {Promise<Object>} - Operation result
   */
  async deleteMessage({ queueName, messageId, popReceipt }) {
    try {
      const queueClient = this.queueServiceClient.getQueueClient(queueName);

      // Delete message
      await queueClient.deleteMessage(messageId, popReceipt);

      return {
        success: true,
        messageId,
        queueName,
      };
    } catch (error) {
      console.error("Error deleting message:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Clear all messages from a queue
   * @param {string} queueName - Queue name
   * @returns {Promise<Object>} - Operation result
   */
  async clearMessages(queueName) {
    try {
      const queueClient = this.queueServiceClient.getQueueClient(queueName);

      // Clear messages
      await queueClient.clearMessages();

      return {
        success: true,
        queueName,
      };
    } catch (error) {
      console.error("Error clearing queue:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update a message in a queue
   * @param {Object} options - Update options
   * @param {string} options.queueName - Queue name
   * @param {string} options.messageId - Message ID
   * @param {string} options.popReceipt - Pop receipt from receive operation
   * @param {string|Object} options.message - New message content
   * @param {number} [options.visibilityTimeout] - New visibility timeout in seconds
   * @returns {Promise<Object>} - Operation result
   */
  async updateMessage({
    queueName,
    messageId,
    popReceipt,
    message,
    visibilityTimeout = 30,
  }) {
    try {
      const queueClient = this.queueServiceClient.getQueueClient(queueName);

      // Convert message to string if it's an object
      const messageContent =
        typeof message === "object" ? JSON.stringify(message) : message;

      // Update message
      const updateResponse = await queueClient.updateMessage(
        messageId,
        popReceipt,
        Buffer.from(messageContent).toString("base64"),
        visibilityTimeout
      );

      return {
        success: true,
        messageId,
        popReceipt: updateResponse.popReceipt,
        nextVisibleOn: updateResponse.nextVisibleOn,
        response: updateResponse,
      };
    } catch (error) {
      console.error("Error updating message:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get queue metadata and approximate message count
   * @param {string} queueName - Queue name
   * @returns {Promise<Object>} - Queue properties
   */
  async getQueueProperties(queueName) {
    try {
      const queueClient = this.queueServiceClient.getQueueClient(queueName);

      // Get properties
      const properties = await queueClient.getProperties();

      return {
        success: true,
        queueName,
        approximateMessagesCount: properties.approximateMessagesCount,
        metadata: properties.metadata,
      };
    } catch (error) {
      console.error("Error getting queue properties:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Set metadata for a queue
   * @param {Object} options - Metadata options
   * @param {string} options.queueName - Queue name
   * @param {Object} options.metadata - Metadata key-value pairs
   * @returns {Promise<Object>} - Operation result
   */
  async setQueueMetadata({ queueName, metadata }) {
    try {
      const queueClient = this.queueServiceClient.getQueueClient(queueName);

      // Set metadata
      await queueClient.setMetadata(metadata);

      return {
        success: true,
        queueName,
        metadata,
      };
    } catch (error) {
      console.error("Error setting queue metadata:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export the service
module.exports = AzureQueueStorageService;
