/**
 * Validate user response against current step requirements
 * @param {Object} currentStepNode - Current step node data
 * @param {Object} userMessage - User message payload
 * @returns {Object|null} - Validation result with next step info
 */
function isValid(currentStepNode, userMessage) {
  if (!currentStepNode || !userMessage) {
    return null;
  }
  console.log("currentStepNode", currentStepNode);
  console.log("userMessage", userMessage);
  const messageText =
    userMessage.messageContent?.text || userMessage.text || "";
  const stepRegex = currentStepNode.regex;
  const messageContent = currentStepNode.message_content;
  const stepType =
    currentStepNode.message_content?.type ||
    currentStepNode.type_of_message ||
    "text";
  const isMandatory = currentStepNode.mandatory;

  // For interactive messages (buttons/lists), validate against options
  if (stepType === "quick_reply" || stepType === "list") {
    const validOptions =
      messageContent?.options || messageContent?.items?.[0]?.options || [];

    const matchedOption = validOptions.find((option) => {
      // Check direct title match
      if (
        option.title?.trim().toLowerCase() === messageText.trim().toLowerCase()
      ) {
        return true;
      }

      // Check postback text match (for button responses)
      if (option.postbackText === messageText) {
        return true;
      }

      return false;
    });
    if (matchedOption) {
      return {
        isValid: true,
        matchedOption,
        nextStep: extractNextStepFromPostback(matchedOption.postbackText),
        validationType: "option_match",
        capturedValue: matchedOption.title,
      };
    } else {
      return {
        isValid: false,
        error: "Please select one of the provided options.",
        validationType: "option_validation_failed",
      };
    }
  }

  // For text inputs, validate against regex if provided
  if (stepType === "text" || !stepType) {
    if (stepRegex) {
      try {
        const regex = new RegExp(stepRegex);
        const isRegexValid = regex.test(messageText);

        if (isRegexValid) {
          return {
            isValid: true,
            capturedValue: messageText,
            validationType: "regex_match",
          };
        } else if (isMandatory) {
          return {
            isValid: false,
            error: getRegexErrorMessage(stepRegex),
            validationType: "regex_validation_failed",
          };
        }
      } catch (error) {
        console.error("Invalid regex pattern:", stepRegex, error);
        return {
          isValid: false,
          error: "Invalid validation pattern configured.",
          validationType: "regex_error",
        };
      }
    } else if (isMandatory && (!messageText || messageText.trim() === "")) {
      return {
        isValid: false,
        error: "This field is required. Please provide a response.",
        validationType: "required_field_empty",
      };
    } else {
      // No regex, not mandatory, or has text - consider valid
      return {
        isValid: true,
        capturedValue: messageText,
        validationType: "text_input",
      };
    }
  }

  // Default case - validation passed
  return {
    isValid: true,
    capturedValue: messageText,
    nextStep: currentStepNode.next_possible_steps[0] || null,
    validationType: "default",
  };
}

/**
 * Extract next step from postback text
 * @param {string} postbackText - Postback text in format "step/option"
 * @returns {string|null} - Next step identifier
 */
function extractNextStepFromPostback(postbackText) {
  if (!postbackText || typeof postbackText !== "string") {
    return null;
  }

  const parts = postbackText.split("/");
  return parts.length > 0 ? parts[0] : null;
}

/**
 * Generate user-friendly error message based on regex pattern
 * @param {string} regexPattern - Regex pattern
 * @returns {string} - User-friendly error message
 */
function getRegexErrorMessage(regexPattern) {
  // Common regex patterns and their user-friendly messages
  const regexMessages = {
    "^[0-9]+$": "Please enter numbers only.",
    "^[a-zA-Z]+$": "Please enter letters only.",
    "^[a-zA-Z0-9]+$": "Please enter letters and numbers only.",
    "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$":
      "Please enter a valid email address.",
    "^\\+?[1-9]\\d{1,14}$": "Please enter a valid phone number.",
    "^.{1,50}$": "Please keep your response under 50 characters.",
    "^.{1,100}$": "Please keep your response under 100 characters.",
    "^.{1,255}$": "Please keep your response under 255 characters.",
  };

  // Return specific message if pattern matches
  for (const [pattern, message] of Object.entries(regexMessages)) {
    if (regexPattern === pattern) {
      return message;
    }
  }

  // Generic message for unknown patterns
  return "Please enter a valid response according to the required format.";
}

/**
 * Check if array exists and has elements
 * @param {*} arr - Array to check
 * @returns {boolean} - True if array exists and has elements
 */
function isArray(arr) {
  return Array.isArray(arr) && arr.length > 0;
}

module.exports = {
  isValid,
  validateUserResponse: isValid, // Alias for consistency with service imports
  extractNextStepFromPostback,
  getRegexErrorMessage,
  isArray,
};
