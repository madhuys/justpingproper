const axios = require("axios");
const logger = require("../../utils/logger");

// Base URL for all API calls
const getBaseUrl = () =>
  process.env.KARIX_URL || "https://rcmapi.instaalerts.zone/services/rcm";

// Create request headers with authentication
function getHeaders(apiKey) {
  return {
    "Content-Type": "application/json",
    Authentication: `Bearer ${apiKey}`,
  };
}

// Make API request with clean error handling
// ...existing code...
async function makeRequest(
  method,
  endpoint,
  apiKey,
  data = null,
  params = null,
) {
  try {
    const url = `${getBaseUrl()}${endpoint}`;
    const config = {
      method,
      url,
      headers: getHeaders(apiKey),
    };

    if (params) {
      config.params = params;
    }

    if (data) {
      config.data = typeof data === "string" ? data : JSON.stringify(data);
    }

    console.log(`Making request to ${url}`, {
      method,
      endpoint,
      dataSize: data ? JSON.stringify(data).length : 0,
    });
    logger.info(`Making request to ${url}`, JSON.stringify(data));
    const response = await axios(config);
    return response.data;
  } catch (error) {
    // Enhanced error logging
    console.error("API request failed:", {
      url: `${getBaseUrl()}${endpoint}`,
      statusCode: error.response?.status,
      errorData: error.response?.data,
      errorMessage: error.message,
    });

    // Add useful properties to the error
    if (error.response) {
      error.statusCode = error.response.status;
      error.errorMessage = error.response.data?.errorMessage || error.message;
      error.errorDetails = error.response.data;
      error.isKarixError = true;
    }
    throw error;
  }
}
// ...existing code...

// Send a message
async function sendMessage(apiKey, { from, to, content, reference = {} }) {
  const webhookDnId = process.env.KARIX_WEBHOOK_DN_ID || "1001";
  try {
    let recipientObj = {};

    if (Array.isArray(to)) {
      recipientObj = {
        recipients: to.map((recipientTo) => ({
          to: recipientTo,
          recipient_type: "individual",
          reference,
        })),
      };
    } else {
      recipientObj = {
        recipient: {
          to,
          recipient_type: "individual",
          reference,
        },
      };
    }

    const data = {
      message: {
        channel: "WABA",
        content,
        ...recipientObj,
        sender: {
          from,
        },
        preferences: {
          webHookDNId: webhookDnId,
        },
      },
      metaData: {
        version: "v1.0.9",
      },
    };

    const response = await makeRequest("post", "/sendMessage", apiKey, data);

    return {
      status: response?.batchStatus,
      data: response,
    };
  } catch (error) {
    // Pass through the error to parent
    throw error;
  }
}

// Send bulk messages
async function sendBulkMessage(apiKey, webhookDnId, from, messages) {
  try {
    // Format verification to catch issues before sending to API
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("Messages must be a non-empty array");
    }

    // Make sure each message has the required structure
    messages.forEach((msg, index) => {
      if (!msg.message?.recipient?.to || !msg.message?.content?.template) {
        console.warn(
          `Message at index ${index} may be malformed:`,
          JSON.stringify(msg),
        );
      }
    });

    const data = {
      channel: "WABA",
      sender: {
        from,
      },
      metaData: {
        version: "v1.0.9",
      },
      preferences: {
        webHookDNId: webhookDnId,
      },
      messages,
    };
    // Log truncated request for debugging
    console.log(
      `Sending bulk message with ${messages.length} messages. Sample:`,
      JSON.stringify(messages[0]).substring(0, 500) + "...",
    );

    logger.info(`Sending bulk message: ${JSON.stringify(data)}`);

    const response = await makeRequest(
      "post",
      "/sendBulkMessage",
      apiKey,
      data,
    );
    logger.info(`Response Sending bulk message: ${JSON.stringify(response)}`);

    return {
      status: response?.batchResponse[0]?.statusDesc,
      data: response,
    };
  } catch (error) {
    // Add request details to the error
    error.messageCount = messages?.length || 0;
    error.senderNumber = from;

    // Pass through the error to parent
    throw error;
  }
}

const sendBroadcastMessage = async (config, recipients, content) => {
  const { api_key, sender_id, webhookDnId = "1001" } = config;

  try {
    const messageResult = await generateMessageContent(content, recipients);

    // Check if message generation was successful
    if (
      !messageResult.success ||
      !messageResult.messages ||
      messageResult.messages.length === 0
    ) {
      throw new Error("No valid messages could be generated for broadcast");
    }

    const providerNumber =
      config?.phone_numbers[0]?.country_code +
      config?.phone_numbers[0]?.phone_number;

    console.log(
      `Starting broadcast to ${messageResult.messages.length} recipients using provider number: ${providerNumber}`,
    );

    // Pass only the messages array to sendBulkMessage
    const response = await sendBulkMessage(
      api_key,
      webhookDnId,
      providerNumber,
      messageResult.messages,
    );

    return {
      status: [] || response?.status,
      data: [] || response,
    };
  } catch (error) {
    // Enhance error handling with more details
    console.error("Broadcast message sending failed:", {
      message: error.message,
      statusCode: error.statusCode,
      errorDetails: error.errorDetails || error.response?.data,
      responseData: error.responseData,
    });

    // Create a more descriptive error object
    const enhancedError = error;
    enhancedError.provider = "karix";
    enhancedError.errorSource = "broadcast";

    // If it's an Axios error, add more context
    if (error.isAxiosError) {
      enhancedError.statusCode = error.response?.status;
      enhancedError.errorMessage =
        error.response?.data?.errorMessage || error.message;
      enhancedError.responseData = error.response?.data;
    }

    // Pass through the error to parent
    throw enhancedError;
  }
};

const generateMessageContent = async (templateData, recipients, mediaUrl) => {
  // Process contacts in batches to prevent memory issues
  const BATCH_SIZE = 5000;
  const results = [];
  let successCount = 0;
  let failedCount = 0;
  const contacts = recipients;

  // Track start time for performance monitoring
  const startTime = Date.now();

  // Process in batches
  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(contacts.length / BATCH_SIZE);

    console.log(
      `Processing batch ${batchNumber} of ${totalBatches} (${i} to ${Math.min(
        i + BATCH_SIZE,
        contacts.length,
      )} contacts)`,
    );

    try {
      const contactBatch = contacts.slice(i, i + BATCH_SIZE);

      // Create message promises for this batch
      const messagePromises = contactBatch.map(async (contact) => {
        try {
          // Validate contact has required fields
          if (!contact.phone) {
            failedCount++;
            return null;
          }

          // Prepare recipient object in the format expected by createMessage
          const recipientTo = {
            country_code: contact.country_code || contact.countryCode,
            phone: contact?.phone,
            first_name: contact?.first_name,
            last_name: contact?.last_name,
            email: contact?.email,
            metadata: contact?.metadata || {},
          };

          // Create the message for this contact
          // const message = await createMessage(
          //     templateData,
          //     parameterValues,
          //     recipientTo,
          // );
          const message = await transferMessage(templateData, recipientTo);
          successCount++;
          return message;
        } catch (contactError) {
          console.error(
            `Error processing contact ${contact?.phone}: ${contactError.message}`,
          );
          failedCount++;
          return null;
        }
      });

      // Resolve all promises in this batch with a timeout to prevent hanging
      const batchMessagesWithTimeout = await Promise.allSettled(
        messagePromises.map((promise) => {
          const timeout = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Message creation timed out")),
              30000,
            ),
          );
          return Promise.race([promise, timeout]);
        }),
      );

      // Filter successful promises and extract their values
      const validBatchMessages = batchMessagesWithTimeout
        .filter((result) => result.status === "fulfilled" && result.value)
        .map((result) => result.value)
        .filter((msg) => msg && Object.keys(msg).length > 0);

      console.log(
        `Batch ${batchNumber} generated ${validBatchMessages.length} valid messages ` +
          `(${
            batchMessagesWithTimeout.filter((r) => r.status === "rejected")
              .length
          } failed)`,
      );

      // Add these valid messages to our results array
      results.push(...validBatchMessages);

      // Add a small delay between batches to prevent overwhelming resources
      if (i + BATCH_SIZE < contacts.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (batchError) {
      console.error(
        `Error processing batch ${batchNumber}: ${batchError.message}`,
      );
      // Continue to next batch even if current batch fails
    }
  }

  const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `Successfully generated ${results.length} messages out of ${contacts.length} contacts ` +
      `in ${processingTime} seconds (${successCount} succeeded, ${failedCount} failed)`,
  );

  // Check if we have any messages to send
  if (results.length === 0) {
    console.error("No valid messages generated for broadcast");
    return {
      success: false,
      error: "No valid messages could be generated",
      stats: {
        totalContacts: contacts.length,
        successCount: 0,
        failedCount: failedCount,
        processingTime,
      },
    };
  }

  return {
    success: true,
    messages: results,
    stats: {
      totalContacts: contacts.length,
      successCount,
      failedCount,
      processingTime,
    },
  };
};

const transferMessage = async (templateData, recipient) => {
  // console.log("transferMessage function called", templateData, recipient);

  // Extract recipient phone number
  const recipientPhone = recipient.phone;
  if (!recipientPhone) {
    throw new Error("Each recipient must have a 'phone' property");
  }

  // Generate placeholder values based on recipient data
  const placeholderValues = generatePlaceholderValues(templateData, recipient);

  // Create message object
  const messageObj = {
    message: {
      content: createContentObject(templateData, placeholderValues),
      recipient: {
        to: recipientPhone,
        recipient_type: "individual",
        reference: {
          cust_ref: "",
        },
      },
    },
  };

  return messageObj;
};

/**
 * Generates placeholder values for a template based on recipient data
 *
 * @param {Object} templateData - Template data object from your system
 * @param {Object} recipient - Recipient object with data to use for placeholders
 * @returns {Object} - Object mapping placeholder indices to values
 */
function generatePlaceholderValues(templateData, recipient) {
  const placeholderValues = {};

  // If no placeholders in template, return empty object
  if (!templateData.placeholders || !templateData.placeholders.length) {
    return placeholderValues;
  }

  // First check if we have templateVariables mapping defined
  if (templateData.templateVariables) {
    // For each placeholder in the template
    templateData.placeholders.forEach((placeholder, index) => {
      const placeholderName = placeholder.name;
      const placeholderIndex = index;

      // Get the recipient field name from templateVariables using the placeholder name
      const recipientField = templateData.templateVariables[placeholderName];

      if (recipientField && recipient[recipientField] !== undefined) {
        // Use the value from the recipient data
        placeholderValues[placeholderIndex] = recipient[recipientField];
      } else {
        // Try direct mapping by placeholder name or index
        if (recipient[placeholderName] !== undefined) {
          placeholderValues[placeholderIndex] = recipient[placeholderName];
        } else if (recipient[placeholderIndex] !== undefined) {
          placeholderValues[placeholderIndex] = recipient[placeholderIndex];
        } else if (
          recipient.placeholderValues &&
          recipient.placeholderValues[placeholderIndex] !== undefined
        ) {
          placeholderValues[placeholderIndex] =
            recipient.placeholderValues[placeholderIndex];
        } else if (
          recipient.placeholderValues &&
          recipient.placeholderValues[placeholderName] !== undefined
        ) {
          placeholderValues[placeholderIndex] =
            recipient.placeholderValues[placeholderName];
        } else {
          // Default to empty string if no value found
          placeholderValues[placeholderIndex] = "";
        }
      }
    });
  } else {
    // No template variables mapping, try direct mapping
    templateData.placeholders.forEach((placeholder) => {
      const placeholderName = placeholder.name;
      const placeholderIndex = placeholder.index;

      if (recipient[placeholderName] !== undefined) {
        placeholderValues[placeholderIndex] = recipient[placeholderName];
      } else if (
        recipient.placeholderValues &&
        recipient.placeholderValues[placeholderIndex] !== undefined
      ) {
        placeholderValues[placeholderIndex] =
          recipient.placeholderValues[placeholderIndex];
      } else if (
        recipient.placeholderValues &&
        recipient.placeholderValues[placeholderName] !== undefined
      ) {
        placeholderValues[placeholderIndex] =
          recipient.placeholderValues[placeholderName];
      } else {
        placeholderValues[placeholderIndex] = "";
      }
    });
  }

  // Log the generated placeholder values for debugging
  console.log("Generated placeholderValues:", placeholderValues);

  return placeholderValues;
}

/**
 * Creates the content object for a message based on template type
 *
 * @param {Object} templateData - Template data object from your system
 * @param {Object} placeholderValues - Values to replace placeholders
 * @returns {Object} - Content object for WABA API
 */
function createContentObject(templateData, placeholderValues) {
  // Extract provider data
  const provider =
    templateData.providerData.find((p) => p.status === "approved") ||
    templateData.providerData[0];

  // Get template ID
  const templateId = provider.provider_template_name;

  // Determine template type and create appropriate content object
  if (templateData.content.carousel && templateData.content.carousel.cards) {
    // Carousel template
    return createCarouselContent(templateData, templateId, placeholderValues);
  } else if (
    templateData.content.header &&
    (templateData.content.header.type === "image" ||
      templateData.content.header.type === "video" ||
      templateData.content.header.type === "document" ||
      templateData.content.header.type === "text")
  ) {
    // Media template
    return createMediaContent(templateData, templateId, placeholderValues);
  } else if (templateData.content.body && templateData.content.body.text) {
    // Text template
    return createTextContent(templateData, templateId, placeholderValues);
  } else {
    throw new Error(
      `Unsupported template type for template: ${templateData.elementName}`,
    );
  }
}

/**
 * Creates a text template content object
 *
 * @param {Object} templateData - Template data from your system
 * @param {string} templateId - Provider template ID
 * @param {Object} placeholderValues - Values to replace placeholders
 * @returns {Object} - Template content object for WABA API
 */
function createTextContent(templateData, templateId, placeholderValues) {
  // Create template object
  return {
    type: "TEMPLATE",
    template: {
      templateId: templateId,
      parameterValues: placeholderValues,
      language: getLanguageCode(templateData),
    },
  };
}

/**
 * Creates a media template content object
 *
 * @param {Object} templateData - Template data from your system
 * @param {string} templateId - Provider template ID
 * @param {Object} placeholderValues - Values to replace placeholders
 * @returns {Object} - Media template content object for WABA API
 */
function createMediaContent(templateData, templateId, placeholderValues) {
  // Create media template object
  const mediaTemplateObj = {
    type: "MEDIA_TEMPLATE",
    preview_url: true,
    shorten_url: true,
    mediaTemplate: {
      templateId: templateId,
      bodyParameterValues: placeholderValues,
      language: getLanguageCode(templateData),
    },
  };

  // Add media object if header is present
  if (templateData.content.header) {
    mediaTemplateObj.mediaTemplate.media = {
      type: templateData.content.header.type.toLowerCase(),
      url: templateData.content.header.media_url,
    };

    // Add filename for documents
    if (
      templateData.content.header.type === "document" &&
      templateData.content.header.filename
    ) {
      mediaTemplateObj.mediaTemplate.media.fileName =
        templateData.content.header.filename;
    }

    // Add title for text headers
    if (templateData.content.header.type === "text") {
      mediaTemplateObj.mediaTemplate.media.title =
        templateData.content.header.text;
    }
  }

  // Add buttons if available
  if (templateData.content.buttons && templateData.content.buttons.length > 0) {
    mediaTemplateObj.mediaTemplate.buttons = createButtonsObject(
      templateData.content.buttons,
      placeholderValues,
    );
  }

  return mediaTemplateObj;
}

/**
 * Creates a carousel template content object
 *
 * @param {Object} templateData - Template data from your system
 * @param {string} templateId - Provider template ID
 * @param {Object} placeholderValues - Values to replace placeholders
 * @returns {Object} - Carousel template content object for WABA API
 */
function createCarouselContent(templateData, templateId, placeholderValues) {
  // Create carousel cards
  const cards = templateData.content.carousel.cards.map((card, index) => {
    // Create card-specific parameter values
    const cardParameterValues = {};

    // Process card-specific placeholders if available
    if (card.placeholders) {
      card.placeholders.forEach((placeholder) => {
        const placeholderIndex = placeholder.index;
        const cardKey = `card_${index}_${placeholderIndex}`;

        if (placeholderValues[cardKey]) {
          cardParameterValues[placeholderIndex] = placeholderValues[cardKey];
        }
      });
    }

    // Create card object
    const cardObj = {
      card_index: index,
      bodyParameterValues: cardParameterValues,
    };

    // Add media if available
    if (card.header) {
      cardObj.media = {
        type: card.header.type.toLowerCase(),
      };

      // Add media URL or media ID
      if (card.header.media_url) {
        cardObj.media.url = card.header.media_url;
      } else if (card.header.media_id) {
        cardObj.media.mediaId = card.header.media_id;
      }
    }

    // Add buttons if available
    if (card.buttons && card.buttons.length > 0) {
      cardObj.buttons = createButtonsObject(card.buttons, placeholderValues);
    }

    return cardObj;
  });

  // Create carousel template object
  return {
    type: "MEDIA_TEMPLATE",
    preview_url: true,
    shorten_url: true,
    mediaTemplate: {
      templateId: templateId,
      bodyParameterValues: placeholderValues,
      language: getLanguageCode(templateData),
      cards: cards,
    },
  };
}

/**
 * Creates buttons object for template
 *
 * @param {Array} buttons - Button definitions
 * @param {Object} placeholderValues - Values to replace placeholders
 * @returns {Object} - Buttons object for WABA API
 */
function createButtonsObject(buttons, placeholderValues) {
  const buttonsObj = {
    quickReplies: [],
    actions: [],
  };

  // Process buttons
  buttons.forEach((button, index) => {
    // Determine button type
    if (button.type === "QUICK_REPLY") {
      buttonsObj.quickReplies.push({
        index: index,
        payload:
          placeholderValues[`button_${index}`] ||
          button.payload ||
          JSON.stringify({
            index: index.toString(),
            label: button.text,
          }),
      });
    } else if (
      button.type === "URL" ||
      button.type === "PHONE_NUMBER" ||
      button.type === "COPY_CODE"
    ) {
      buttonsObj.actions.push({
        type: button.type.toLowerCase(),
        index: index.toString(),
        payload: placeholderValues[`button_${index}`] || button.payload || "",
      });
    }
  });

  // Remove empty arrays
  if (buttonsObj.quickReplies.length === 0) {
    delete buttonsObj.quickReplies;
  }

  if (buttonsObj.actions.length === 0) {
    delete buttonsObj.actions;
  }

  // If no buttons, return null
  if (Object.keys(buttonsObj).length === 0) {
    return null;
  }

  return buttonsObj;
}

/**
 * Gets language code from template data
 *
 * @param {Object} templateData - Template data from your system
 * @returns {string} - Language code
 */
function getLanguageCode(templateData) {
  // Try to get language from templateData
  if (templateData.language_code) {
    return templateData.language_code;
  }

  // Try to get language from metadata
  if (
    templateData.metadata &&
    templateData.metadata.languages &&
    templateData.metadata.languages.length > 0
  ) {
    return templateData.metadata.languages[0];
  }

  // Default to English
  return "en";
}

module.exports = {
  sendBroadcastMessage,
  sendBulkMessage,
  makeRequest,
};
