const axios = require("axios");
const FormData = require("form-data");
const qs = require("qs");
const { makeRequest } = require("../system/providers/karix/broadcast");
const logger = require("../system/utils/logger");
const MessageEventService = require("../api/MessageEvents/service");

const sendWhatsAppMessage = async (
  userData,
  message_content,
  businessChannel,
  providerNumber,
) => {
  console.log("Sending WhatsApp message with userData:", userData);
  console.log("Message content:", message_content, businessChannel);

  if (userData?.service === "wati") {
    await watiServices(userData, message_content);
    return;
  } else if (businessChannel?.provider_name === "karix") {
    await karixServices(
      userData,
      message_content,
      businessChannel,
      providerNumber,
    );
    return;
  } else if (userData?.service === "gupshup") {
    await gupShupServices(userData, message_content);
    return;
  } else if (userData?.service === "justping") {
    await metaServices(userData, message_content, providerNumber);
    return;
  }

  const messageData = {
    provider: businessChannel?.provider_name,
    type: message_content?.type || "text",
    text: message_content?.text,
    attachments: message_content?.attachments,
    content: {
      ...message_content,
    },
    sender: {
      phone: providerNumber, // Customer's phone
      name: "", // Add logic to fetch name if needed
    },
    recipient: {
      phone: userData?.phone, // Business phone number
    },
    timestamp: new Date().toISOString(),
    metadata: {
      raw: message_content, // Store the raw message for debugging/reference
    },
  };

  // Store the incoming message
  const storedMessage = await MessageEventService.storeIncomingMessage(
    messageData,
  );
  return;
};

const gupShupServices = async (userData, body) => {
  const GUPSHUP_API_KEY = await getSecret("GUPSHUP-API-KEY");

  try {
    let data = qs.stringify({
      channel: "whatsapp",
      source: "917834811114",
      destination: userData?.userId,
      "src.name": "JustPingSandBot",
      message: typeof body === "object" ? JSON.stringify(body) : body,
    });

    let config = {
      method: "post",
      url: "https://api.gupshup.io/wa/api/v1/msg",
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/x-www-form-urlencoded",
        apikey: GUPSHUP_API_KEY,
      },
      data: data,
    };
    const response = await axios.request(config);
    console.log("Message sent:", JSON.stringify(response.data));
  } catch (error) {
    console.error("Error in sendDirectMessage:", error);
  }
};

const justPingServices = async (res, userId, body) => {
  try {
    res.json({ messageContent: body });
    return;
  } catch (error) {
    console.error("Error in sendDirectMessage:", error);
  }
};

const karixServices = async (
  userData,
  message,
  businessChannel,
  providerNumber,
) => {
  const phone = userData?.phone;
  const { api_key } = businessChannel?.config || {};
  const KARIX_WANUMBER = providerNumber;
  const message_content = convertMessageContent(
    businessChannel?.provider_name,
    message,
  );

  const data = {
    channel: "WABA",
    content: message_content,
    recipient: {
      to: phone,
      recipient_type: "individual",
    },
    sender: {
      from: KARIX_WANUMBER,
    },
    preferences: {
      webHookDNId: 8271,
    },
  };
  const payload = {
    message: data,
    metaData: {
      version: "v1.0.9",
    },
  };
  try {
    const response = await makeRequest(
      "post",
      "/sendMessage",
      api_key,
      payload,
    );
    logger.info(`Response Sending message: ${JSON.stringify(response)}`);
    return response;
  } catch (error) {
    console.error("Error in sendDirectMessage:", error);
  }
};

const watiServices = async (userData, message) => {
  const campaignData = await campaignService.findOne({
    _id: userData?.campaignId,
  });
  const companyId = campaignData?.companyId;
  const userId = userData?.userId;
  const service = userData?.service;
  const body = convertMessageContent(service, message);
  if (message?.type === "list") {
    await sendInteractiveListMessage(companyId, userId, body);
    return;
  } else if (message?.type === "quick_reply") {
    await sendInteractiveButtonsMessage(companyId, userId, body);
    return;
  } else {
    await sendSessionMessage(companyId, userId, body);
    return;
  }
};

const sendSessionMessage = async (companyId, userId, body) => {
  const providerData = await integrationService.findOne({
    companyId,
    provider: "wati",
  });
  if (!providerData) {
    console.log("Provider not found");
    return;
  }
  const BROADCAST_AUTHORIZATION = providerData?.wati?.token;
  const PORT = providerData?.wati?.port;

  const url = `${WATI_URL}/${PORT}/api/v1/sendSessionMessage/${userId}`;
  const form = new FormData();
  form.append("messageText", body);
  try {
    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${BROADCAST_AUTHORIZATION}`,
      },
    });
    console.log("Send Session Message", {
      status: response?.data?.ok,
      id: response?.data?.message?.whatsappMessageId,
      data: response?.data,
    });
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response ? error.response.data : error.message,
    );
  }
};

const sendInteractiveButtonsMessage = async (companyId, userId, body) => {
  const providerData = await integrationService.findOne({
    companyId,
    provider: "wati",
  });
  if (!providerData) {
    console.log("Provider not found");
    return;
  }
  const BROADCAST_AUTHORIZATION = providerData?.wati?.token;
  const PORT = providerData?.wati?.port;
  const url = `${WATI_URL}/${PORT}/api/v1/sendInteractiveButtonsMessage?whatsappNumber=${userId}`;
  const data = {
    ...body,
  };
  const config = {
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${BROADCAST_AUTHORIZATION}`,
      "Content-Type": "application/json-patch+json",
    },
  };

  try {
    const response = await axios.post(url, data, config);
    console.log("Send Interactive Buttons Message", {
      status: response?.data?.ok,
      id: response?.data?.message?.whatsappMessageId,
      data: response?.data,
    });
  } catch (error) {
    console.error(error);
  }
};

const sendInteractiveListMessage = async (companyId, userId, body) => {
  const providerData = await integrationService.findOne({
    companyId,
    provider: "wati",
  });
  if (!providerData) {
    console.log("Provider not found");
    return;
  }
  const BROADCAST_AUTHORIZATION = providerData?.wati?.token;
  const PORT = providerData?.wati?.port;
  const url = `${WATI_URL}/${PORT}/api/v1/sendInteractiveListMessage?whatsappNumber=${userId}`;
  const data = { ...body };
  const config = {
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${BROADCAST_AUTHORIZATION}`,
      "Content-Type": "application/json-patch+json",
    },
  };

  try {
    const response = await axios.post(url, data, config);
    console.log("Send Interactive List Message", {
      status: response?.data?.ok,
      id: response?.data?.message?.whatsappMessageId,
      data: response?.data,
    });
  } catch (error) {
    console.error(error);
  }
};

const metaServices = async (userData, message, providerNumber) => {
  const userId = userData?.userId;
  const service = userData?.service;
  const broadcastData = await broadcastService.findOne({
    _id: userData?.broadcastId,
  });
  const companyId = broadcastData?.companyId;

  let providerData = await integrationService.findOne({
    companyId,
    provider: "justping",
  });

  if (!providerData) {
    console.log("Justping provider not found");
    return;
  }
  providerData = providerData.toObject();

  const wabaInfo = await findWabaInfoByPhoneNumber(
    providerData,
    providerNumber,
  );

  if (!wabaInfo || !wabaInfo.ACCESS_TOKEN || !wabaInfo.WABA_ID) {
    console.error(
      `Invalid WABA configuration for phone number: ${providerNumber}`,
    );
    return { success: false, error: "Invalid WABA configuration" };
  }

  const { ACCESS_TOKEN, phoneNumberId } = wabaInfo;
  const META_API_URL =
    process.env.META_API_URL || "https://graph.facebook.com/v18.0";
  let url = `${META_API_URL}/${phoneNumberId}/messages`;

  const message_content = convertToMetaCloudAPIFormat(message, userId);
  const data = message_content || {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: userId,
    type: "text",
    text: {
      preview_url: false,
      body: "Thank You",
    },
  };
  console.log("Message Content", JSON.stringify(data));
  try {
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    console.log("Meta WhatsApp Message Sent:", {
      status: response?.status,
      data: JSON.stringify(response?.data),
    });
  } catch (error) {
    console.error(
      "Error sending Meta WhatsApp message:",
      error.response ? error.response.data : error.message,
    );
  }
};

const convertMessageContent = (service, message_content) => {
  if (service === "wati") {
    switch (message_content.type) {
      case "quick_reply":
        if (message_content.content.type === "text") {
          return {
            body: message_content.content.text,
            buttons: message_content.options.map((option) => ({
              text: option.title,
            })),
          };
        }
        break;
      case "text":
        return message_content.text;
      case "list":
        return {
          header: message_content.title,
          body: message_content.body,
          buttonText: message_content.globalButtons[0].title,
          sections: message_content.items.map((item) => ({
            title: item.title,
            rows: item.options.map((option) => ({
              title: option.title,
            })),
          })),
        };
    }
  } else if (service === "karix") {
    switch (message_content.type) {
      case "quick_reply":
        return {
          preview_url: false,
          shorten_url: false,
          type: "INTERACTIVE",
          interactive: {
            type: "button",
            body: {
              text: message_content.content.text,
            },
            action: {
              buttons: message_content.options.map((option, i) => ({
                type: "reply",
                reply: {
                  id: i,
                  title: option.title,
                },
              })),
            },
          },
        };

      case "list":
        return {
          preview_url: false,
          shorten_url: false,
          type: "INTERACTIVE",
          interactive: {
            type: "list",
            header: {
              type: "text",
              text: message_content.title,
            },
            body: {
              text: message_content.body,
            },
            footer: {
              text: "Please select an experience level",
            },
            action: {
              button: message_content.globalButtons[0].title,
              sections: message_content.items.map((item, i) => ({
                title: item.title,
                rows: item.options.map((option, j) => ({
                  id: `${i}-${j}`,
                  title: option.title,
                })),
              })),
            },
          },
        };

      case "text":
        return {
          preview_url: false,
          text: message_content.text,
          type: "TEXT",
        };
    }
  } else if (service === "gupshup") {
    return message_content;
  } else if (service === "justping") {
    return message_content;
  } else if (service === "meta") {
    switch (message_content.type) {
      case "text":
        return {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: message_content.to || "",
          type: "text",
          text: {
            preview_url: false,
            body: message_content.text,
          },
        };

      case "quick_reply":
        return {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: message_content.to || "",
          type: "interactive",
          interactive: {
            type: "button",
            body: {
              text: message_content.content.text,
            },
            action: {
              buttons: message_content.options.map((option, index) => ({
                type: "reply",
                reply: {
                  id: `button-${index}`,
                  title: option.title.substring(0, 20), // Meta has a 20 character limit for button titles
                },
              })),
            },
          },
        };

      case "list":
        return {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: message_content.to || "",
          type: "interactive",
          interactive: {
            type: "list",
            header: {
              type: "text",
              text: message_content.title,
            },
            body: {
              text: message_content.body,
            },
            footer: {
              text: message_content.footer || "Please select an option",
            },
            action: {
              button: message_content.globalButtons[0].title,
              sections: message_content.items.map((item, sectionIndex) => ({
                title: item.title,
                rows: item.options.map((option, rowIndex) => ({
                  id: `section-${sectionIndex}-row-${rowIndex}`,
                  title: option.title,
                  description: option.description || "",
                })),
              })),
            },
          },
        };
    }
  }
  throw new Error("Invalid message_content1 format");
};

/**
 * Convert a conversation step to Meta Cloud API format
 * @param {Object} step - A conversation step object
 * @param {Object} variables - Optional variables to replace placeholders
 * @returns {Object} - Formatted message for Meta Cloud API
 */
function convertToMetaCloudAPIFormat(message_content, providerNumber) {
  if (!message_content) {
    throw new Error("Invalid step: Missing required properties");
  }

  // Initialize the message container
  const message = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: providerNumber,
    type: mapMessageType(message_content.type),
  };

  // Add the appropriate message content based on type
  switch (message.type) {
    case "text":
      message.text = {
        body: message_content.text,
      };
      break;

    case "interactive":
      message.interactive = formatInteractiveMessage(message_content);
      break;

    case "image":
      message.image = {
        link: message_content.url,
      };
      break;

    case "video":
      message.video = {
        link: message_content.url,
      };
      break;

    case "document":
      message.document = {
        link: message_content.url,
      };
      break;

    case "audio":
      message.audio = {
        link: message_content.url,
      };
      break;

    default:
      throw new Error(`Unsupported message type: ${message.type}`);
  }

  return message;
}

/**
 * Format an interactive message (quick_reply or list)
 * @param {Object} step - The processed step
 * @returns {Object} - Formatted interactive message content
 */
function formatInteractiveMessage(message_content) {
  const content = message_content;
  const type_of_message = content.type;

  if (type_of_message === "quick_reply") {
    // Format quick reply
    return {
      type: "button",
      body: {
        text: content.content.text,
      },
      footer: {
        text: "", // Empty footer is fine, but it's required by the API
      },
      action: {
        buttons: content.options.map((option) => ({
          type: "reply",
          reply: {
            id: `${option.postbackText}${option.title}`,
            title: option.title,
          },
        })),
      },
    };
  } else if (type_of_message === "list") {
    // Format list
    return {
      type: "list",
      header: {
        type: "text",
        text: content.title,
      },
      body: {
        text: content.body,
      },
      footer: {
        text: "", // Empty footer is fine, but it's required by the API
      },
      action: {
        button: content.globalButtons[0].title,
        sections: content.items.map((item) => ({
          title: item.title,
          rows: item.options.map((option) => ({
            id: `${option.postbackText}${option.title}`,
            title: option.title,
          })),
        })),
      },
    };
  }

  throw new Error(`Unsupported interactive message type: ${type_of_message}`);
}

/**
 * Map the message type to a Meta Cloud API message type
 * @param {string} stepType - The type_of_message from the step
 * @param {string} contentType - The type from message_content
 * @returns {string} - Meta Cloud API message type
 */
function mapMessageType(contentType) {
  if (contentType === "image") return "image";
  if (contentType === "video") return "video";
  if (contentType === "document") return "document";
  if (contentType === "audio") return "audio";

  if (contentType === "quick_reply" || contentType === "list") {
    return "interactive";
  }

  return "text";
}

/**
 * Send a message using the Meta Cloud API
 * @param {Object} message - Formatted message for Meta Cloud API
 * @param {string} accessToken - Meta Cloud API access token
 * @returns {Promise} - Response from the API call
 */
async function sendMessage(message, accessToken) {
  const url = "https://graph.facebook.com/v18.0/FROM_PHONE_NUMBER_ID/messages";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(message),
    });

    return await response.json();
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Process an entire conversation based on user responses
 * @param {Object} conversationJson - The entire conversation JSON
 * @param {string} accessToken - Meta Cloud API access token
 * @param {Object} initialVariables - Initial variables to use
 * @returns {Object} - Object to track conversation state
 */
function createConversationProcessor(
  conversationJson,
  accessToken,
  initialVariables = {},
) {
  const steps = conversationJson.reduce((map, step) => {
    map[step.step] = step;
    return map;
  }, {});

  const variables = { ...initialVariables };
  let currentStep = conversationJson[0].step;

  return {
    /**
     * Get the current step to process
     * @returns {Object} - Current step
     */
    getCurrentStep() {
      return steps[currentStep];
    },

    /**
     * Process the current step and send message
     * @returns {Promise} - Result of sending the message
     */
    async processCurrentStep() {
      const step = this.getCurrentStep();
      if (!step) return null;

      const message = convertToMetaCloudAPIFormat(step, variables);
      return await sendMessage(message, accessToken);
    },

    /**
     * Handle user response and move to next step
     * @param {string} response - User's response
     * @returns {Object} - Next step
     */
    handleResponse(response) {
      const step = this.getCurrentStep();

      // Store variable value if this step captures a variable
      if (step.variable) {
        variables[step.variable] = response;
      }

      // Determine next step based on response and possible next steps
      if (step.nextPossibleSteps && step.nextPossibleSteps.length > 0) {
        // For interactive messages, the response should match a postbackText
        if (
          step.type_of_message === "quick_reply" ||
          step.type_of_message === "list"
        ) {
          // Find if response matches any option's postbackText
          let nextStep = response;
          currentStep = nextStep;
        } else {
          // For text inputs, go to the first next possible step
          currentStep = step.nextPossibleSteps[0];
        }
      } else {
        // No more steps
        currentStep = null;
      }

      return steps[currentStep];
    },

    /**
     * Get all collected variables
     * @returns {Object} - All variables collected during conversation
     */
    getVariables() {
      return { ...variables };
    },
  };
}

module.exports = {
  sendWhatsAppMessage,
  sendSessionMessage,
  sendInteractiveButtonsMessage,
  sendInteractiveListMessage,
};
