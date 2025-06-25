// AgentsFlow/conversationFlowService.js
const logger = require("../system/utils/logger");
const Conversation = require("../system/models/Conversation");
const AgentNode = require("../system/models/AgentNode");
const { getNodesByAgentAndStep } = require("../api/Agents/service");

/**
 * Update conversation to next step
 * @param {string} conversationId - Conversation ID
 * @param {string} nextStep - Next step identifier
 * @param {Object} capturedData - Data captured from user response
 * @returns {Promise<Object>} - Updated conversation
 */
async function updateConversationStep(
  conversationId,
  nextStep,
  capturedData = {},
) {
  try {
    const updateData = {
      current_step: nextStep,
      updated_at: new Date().toISOString(),
    };

    // Store captured variables in conversation metadata
    if (capturedData.variable && capturedData.value) {
      const conversation = await Conversation.query().findById(conversationId);
      const existingMetadata = conversation.metadata || {};
      const existingVariables = existingMetadata.captured_variables || {};

      updateData.metadata = {
        ...existingMetadata,
        captured_variables: {
          ...existingVariables,
          [capturedData.variable]: capturedData.value,
        },
        last_response_at: new Date().toISOString(),
      };
    }

    const updatedConversation = await Conversation.query().patchAndFetchById(
      conversationId,
      updateData,
    );

    logger.info(`Updated conversation ${conversationId} to step: ${nextStep}`);

    return updatedConversation;
  } catch (error) {
    logger.error(`Error updating conversation step: ${error.message}`, error);
    throw error;
  }
}

/**
 * Get next step in conversation flow
 * @param {Object} currentStepNode - Current step node data
 * @param {Object} validationResult - User response validation result
 * @param {Object} agentDefinition - Agent flow definition
 * @returns {Promise<Object>} - Next step node or completion info
 */
async function getNextStepNode(
  currentStepNode,
  validationResult,
  agentDefinition,
) {
  try {
    // If validation failed, return current step for retry
    if (!validationResult.isValid) {
      return {
        shouldRetry: true,
        currentNode: currentStepNode,
        errorMessage: validationResult.error,
      };
    }

    // Determine next step based on response type
    let nextStepIdentifier = null;

    if (validationResult.nextStep) {
      // From postback text (buttons/lists)
      nextStepIdentifier = validationResult.nextStep;
    } else if (currentStepNode.next_possible_steps?.length > 0) {
      // Use first available next step for text inputs
      nextStepIdentifier = currentStepNode.next_possible_steps[0];
    }

    // If no next step, conversation is complete
    if (!nextStepIdentifier || nextStepIdentifier === "stop") {
      return {
        isComplete: true,
        completionMessage: "Thank you! Your conversation has been completed.",
      };
    }

    // Find next node in agent definition
    const nextNode = await AgentNode.query()
      .where("agent_id", currentStepNode.agent_id)
      .where("step", nextStepIdentifier)
      .first();

    if (!nextNode) {
      logger.warn(`Next step node not found: ${nextStepIdentifier}`);
      return {
        isComplete: true,
        completionMessage: "Thank you for your responses!",
      };
    }

    return {
      nextNode,
      nextStepIdentifier,
      shouldAdvance: true,
    };
  } catch (error) {
    logger.error(`Error determining next step: ${error.message}`, error);
    throw error;
  }
}

/**
 * Generate response message for current step
 * @param {Object} stepNode - Step node data
 * @param {Object} conversationVariables - Variables captured so far
 * @returns {Object} - Formatted response payload
 */
function generateStepResponse(stepNode, conversationVariables = {}) {
  try {
    const messageContent = stepNode.message_content || {};

    // Get the node type from either type_of_message or message_content.type
    const nodeType = stepNode.type_of_message || messageContent.type || "text";

    console.log("stepNode.message_content:", messageContent);
    console.log("nodeType determined:", nodeType);

    // Replace variables in message content
    const processedContent = replaceVariablesInContent(
      messageContent,
      conversationVariables,
    );

    console.log("processedContent:", processedContent);

    switch (nodeType) {
      case "quick_reply":
      case "buttons":
        return {
          type: "quick_reply",
          content: {
            type: "text",
            text:
              processedContent.content?.text ||
              processedContent.text ||
              "Please choose an option:",
          },
          options: processedContent.options || [],
        };

      case "list":
        return {
          type: "list",
          title: processedContent.title || "Please select an option",
          body: processedContent.body || "",
          globalButtons: processedContent.globalButtons || [
            { type: "text", title: "Select" },
          ],
          items: processedContent.items || [],
        };

      case "text":
      default:
        return {
          type: "text",
          text:
            processedContent.content?.text ||
            processedContent.text ||
            "Please provide your response.",
        };
    }
  } catch (error) {
    logger.error(`Error generating step response: ${error.message}`, error);
    return {
      type: "text",
      text: "Please provide your response.",
    };
  }
}

/**
 * Replace variables in message content with actual values
 * @param {Object} content - Message content with potential variables
 * @param {Object} variables - Variable values
 * @returns {Object} - Content with variables replaced
 */
function replaceVariablesInContent(content, variables = {}) {
  try {
    const contentStr = JSON.stringify(content);
    let processedStr = contentStr;

    // Replace common variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "gi");
      processedStr = processedStr.replace(regex, value || "");
    });

    // Replace system variables
    const systemReplacements = {
      "{{user_name}}": variables.name || variables.user_name || "there",
      "{{name}}": variables.name || variables.user_name || "there",
      "{{phone}}": variables.phone || "",
      "{{date}}": new Date().toLocaleDateString(),
      "{{time}}": new Date().toLocaleTimeString(),
    };

    Object.entries(systemReplacements).forEach(([placeholder, value]) => {
      const regex = new RegExp(placeholder, "gi");
      processedStr = processedStr.replace(regex, value);
    });

    return JSON.parse(processedStr);
  } catch (error) {
    logger.error(`Error replacing variables: ${error.message}`, error);
    return content;
  }
}

/**
 * Handle conversation flow retry with error message
 * @param {Object} currentStepNode - Current step node
 * @param {string} errorMessage - Error message to display
 * @param {Object} conversationVariables - Current conversation variables
 * @returns {Object} - Retry response with error
 */
function generateRetryResponse(
  currentStepNode,
  errorMessage,
  conversationVariables = {},
) {
  const stepResponse = generateStepResponse(
    currentStepNode,
    conversationVariables,
  );

  // Prepend error message to the step response
  if (stepResponse.type === "text") {
    stepResponse.text = `❌ ${errorMessage}\n\n${stepResponse.text}`;
  } else if (stepResponse.content?.text) {
    stepResponse.content.text = `❌ ${errorMessage}\n\n${stepResponse.content.text}`;
  }

  return stepResponse;
}

/**
 * Get conversation variables from metadata
 * @param {Object} conversation - Conversation object
 * @returns {Object} - Extracted variables
 */
function getConversationVariables(conversation) {
  try {
    const metadata = conversation.metadata || {};
    return {
      ...(metadata.captured_variables || {}),
      phone: conversation.end_user?.phone || "",
      name: conversation.end_user?.name || "",
    };
  } catch (error) {
    logger.error(
      `Error extracting conversation variables: ${error.message}`,
      error,
    );
    return {};
  }
}

/**
 * Close conversation with specified reason
 * @param {string} conversationId - Conversation ID
 * @param {string} reason - Reason for closure
 * @param {Object} additionalMetadata - Additional metadata to store
 * @returns {Promise<Object>} - Updated conversation
 */
async function closeConversation(
  conversationId,
  reason = "completed",
  additionalMetadata = {},
) {
  try {
    const updateData = {
      status: "completed",
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Get existing conversation to preserve metadata
    const conversation = await Conversation.query().findById(conversationId);
    if (conversation) {
      const existingMetadata = conversation.metadata || {};
      updateData.metadata = {
        ...existingMetadata,
        completion_reason: reason,
        closed_at: new Date().toISOString(),
        ...additionalMetadata,
      };
    }

    const updatedConversation = await Conversation.query().patchAndFetchById(
      conversationId,
      updateData,
    );

    logger.info(`Conversation ${conversationId} closed with reason: ${reason}`);

    return updatedConversation;
  } catch (error) {
    logger.error(`Error closing conversation: ${error.message}`, error);
    throw error;
  }
}

module.exports = {
  updateConversationStep,
  getNextStepNode,
  generateStepResponse,
  generateRetryResponse,
  getConversationVariables,
  replaceVariablesInContent,
  closeConversation,
};
