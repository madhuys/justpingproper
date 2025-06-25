// AgentsFlow/aiService.js
const logger = require("../system/utils/logger");
const axios = require("axios");

/**
 * AI Service module for handling LLM interactions
 */

/**
 * Get prompt and process user message through AI
 * @param {Object} userData - User data and context
 * @param {Object} questionData - Current step/question data
 * @param {string} messageBody - User's message text
 * @param {Object} agentData - Agent configuration
 * @returns {Promise<Object>} - AI response in JSON format
 */
async function getPromptByBotName(
  userData,
  questionData,
  messageBody,
  agentData,
) {
  try {
    logger.info("Processing AI prompt request", {
      userId: userData?.userId,
      step: questionData?.step,
      messageLength: messageBody?.length,
      agentId: agentData?.id,
    });

    // Get conversation history/threads
    const threads = await getConversationThreads(userData?.userId);

    // Add current user message to conversation
    threads.push({
      role: "user",
      content: messageBody,
    });

    // Get AI configuration from question data
    const aiConfig = questionData?.ai_config || {};
    const modelType = aiConfig?.ai_provider || "gpt";

    // Build system prompt
    const systemPrompt = buildSystemPrompt(questionData, agentData, userData);

    // Format conversation based on AI model
    let conversation;
    let aiClient;

    switch (modelType) {
      case "gemini":
        conversation = formatGeminiConversation(
          systemPrompt,
          threads,
          aiConfig,
        );
        aiClient = chatCompletionGemini;
        break;
      case "claude":
        conversation = formatClaudeConversation(
          systemPrompt,
          threads,
          aiConfig,
        );
        aiClient = chatCompletionClaude;
        break;
      case "grok":
        conversation = formatGrokConversation(systemPrompt, threads, aiConfig);
        aiClient = chatCompletionGrok;
        break;
      case "gpt":
      default:
        conversation = formatGPTConversation(systemPrompt, threads, aiConfig);
        aiClient = chatCompletionGPT;
        break;
    } // Make AI API call with retry logic
    const result = await aiClient(conversation);

    // Parse and validate JSON response from AI
    const parsedResponse = parseAndValidateAIResponse(result);

    logger.info("AI response processed successfully", {
      type: parsedResponse?.type,
      hasMessage: !!parsedResponse?.msg,
      confidence: parsedResponse?.confidence,
    });
    console.log("parsedResponse", parsedResponse);

    return parsedResponse;
  } catch (error) {
    logger.error("Error in getPromptByBotName:", error);

    // Return fallback response
    return {
      type: "invalidinput",
      msg: "I'm sorry, I didn't understand that. Could you please try again?",
      confidence: 0.1,
    };
  }
}

/**
 * Create AI response message with content.text format
 * @param {Object} jsonData - AI response data
 * @param {Object} questionData - Current question data
 * @param {string} messageType - Type of message (quick_reply, text, etc.)
 * @param {Array} options - Options for quick_reply messages
 * @returns {Object} - Formatted message with content.text
 */
function createAIResponseMessage(
  jsonData,
  questionData,
  messageType = null,
  options = null,
) {
  const originalMessage = questionData?.message_content || { type: "text" };

  // Determine message type
  const type = messageType || originalMessage.type || "text";

  // Create the response message based on type
  let responseMessage;
  if (type === "text") {
    // For text messages: replace the text field directly
    responseMessage = {
      type: type,
      text: jsonData?.msg,
    };

    // Preserve other properties from original message except text and content
    Object.keys(originalMessage).forEach((key) => {
      if (key !== "text" && key !== "content" && !responseMessage[key]) {
        responseMessage[key] = originalMessage[key];
      }
    });
  } else if (type === "quick_reply" || type === "list") {
    // For quick_reply and list messages: replace content.text
    responseMessage = {
      type: type,
      content: {
        text: jsonData?.msg,
        type: "text",
      },
    };

    // Add options if this is a quick_reply message
    if (options && Array.isArray(options)) {
      responseMessage.options = options;
    } else if (originalMessage.options) {
      responseMessage.options = originalMessage.options;
    }

    // Preserve other properties from original message except content and options
    Object.keys(originalMessage).forEach((key) => {
      if (key !== "content" && key !== "options" && !responseMessage[key]) {
        responseMessage[key] = originalMessage[key];
      }
    });
  } else {
    // Fallback for other message types: use content.text approach
    responseMessage = {
      type: type,
      content: {
        text: jsonData?.msg,
        type: "text",
      },
    };

    // Preserve other properties from original message except content
    Object.keys(originalMessage).forEach((key) => {
      if (key !== "content" && !responseMessage[key]) {
        responseMessage[key] = originalMessage[key];
      }
    });
  }

  return responseMessage;
}

/**
 * Handle AI response and format for conversation flow
 * @param {Object} jsonData - AI response data
 * @param {Object} userData - User data
 * @param {Object} questionData - Current question data
 * @param {Object} flowData - Flow configuration
 * @returns {Promise<Object>} - Formatted message content
 */
async function handlingAiResponse(jsonData, userData, questionData, flowData) {
  try {
    logger.info("Handling AI response", {
      type: jsonData?.type,
      userId: userData?.userId,
      step: questionData?.step,
    }); // Handle different AI response types
    switch (jsonData?.type) {
      case "KBquery":
        return createAIResponseMessage(jsonData, questionData, "text");

      case "invalidinput":
      case "profanity":
      case "greeting":
        return createAIResponseMessage(jsonData, questionData);

      case "transform":
        // AI extracted/transformed user input - ask for confirmation
        const transformOptions = [
          { type: "text", title: "Yes", postbackText: "confirm_yes" },
          { type: "text", title: "No", postbackText: "confirm_no" },
        ];

        // Store pending data for confirmation
        await storePendingData(userData.userId, {
          step: questionData?.step,
          variable: questionData?.variable,
          value: jsonData?.value,
          originalInput: jsonData?.originalInput,
        });

        return createAIResponseMessage(
          jsonData,
          questionData,
          "quick_reply",
          transformOptions,
        );
      case "validinput":
        // AI recognized valid input - process the value and advance to next step
        try {
          const {
            updateConversationStep,
            generateStepResponse,
          } = require("./conversationFlowService");
          const { getNodesByAgentAndStep } = require("../api/Agents/service");

          logger.info("Processing valid input:", {
            value: jsonData?.value,
            variable: questionData?.variable,
          });

          // Store the captured value if this step has a variable
          if (questionData?.variable && jsonData?.value) {
            await updateConversationStep(
              userData.conversationId,
              questionData.step,
              {
                variable: questionData.variable,
                value: jsonData.value,
              },
            );
          }

          // Get next step
          const nextStepIdentifier = questionData?.next_possible_steps?.[0];

          if (nextStepIdentifier && nextStepIdentifier !== "stop") {
            const nextStepNode = await getNodesByAgentAndStep(
              questionData.agent_id,
              nextStepIdentifier,
            );

            if (nextStepNode) {
              // Update conversation to next step
              await updateConversationStep(
                userData.conversationId,
                nextStepIdentifier,
                {},
              );

              // Create updated variables for next step
              const updatedVariables = {
                ...userData.capturedData,
                [questionData.variable]: jsonData.value,
              }; // Generate response for next step
              const nextStepResponse = generateStepResponse(
                Array.isArray(nextStepNode) ? nextStepNode[0] : nextStepNode,
                updatedVariables,
              );

              // Create AI acknowledgment message and replace the next step's text with AI message
              const aiMessage = createAIResponseMessage(jsonData, questionData);

              // Replace the next step's message text with the AI message text
              if (nextStepResponse.type === "text") {
                nextStepResponse.text = jsonData?.msg || aiMessage.text;
              } else if (nextStepResponse.content?.text) {
                nextStepResponse.content.text =
                  jsonData?.msg || aiMessage.content?.text || aiMessage.text;
              } else if (
                nextStepResponse.type === "quick_reply" &&
                nextStepResponse.content
              ) {
                nextStepResponse.content.text =
                  jsonData?.msg || aiMessage.content?.text || aiMessage.text;
              }

              // Log the replacement for debugging
              logger.info("Replaced next step message with AI message:", {
                originalType: nextStepResponse.type,
                aiMessage: jsonData?.msg,
                hasContentText: !!nextStepResponse.content?.text,
                hasDirectText: !!nextStepResponse.text,
              });

              return nextStepResponse;
            }
          }

          // If no next step or processing failed, return AI acknowledgment
          return createAIResponseMessage(jsonData, questionData);
        } catch (error) {
          logger.error("Error processing valid input:", error);
          // Fallback to just showing AI acknowledgment
          return createAIResponseMessage(jsonData, questionData);
        }
      case "restart":
        const restartOptions = [
          { type: "text", title: "Restart", postbackText: "restart" },
          {
            type: "text",
            title: "Continue",
            postbackText: userData?.currentStep || "continue",
          },
        ];
        return createAIResponseMessage(
          jsonData,
          questionData,
          "quick_reply",
          restartOptions,
        );

      case "escalate":
        // Hand off to human agent
        await escalateToHuman(userData, questionData);
        const escalateMessage = {
          ...jsonData,
          msg:
            jsonData?.msg ||
            "Let me connect you with a human agent who can help you better.",
        };
        return createAIResponseMessage(escalateMessage, questionData, "text");

      default:
        logger.warn("Unknown AI response type:", jsonData?.type);
        const defaultMessage = {
          ...jsonData,
          msg:
            jsonData?.msg ||
            "I'm sorry, I didn't understand that. Could you please try again?",
        };
        return createAIResponseMessage(defaultMessage, questionData, "text");
    }
  } catch (error) {
    logger.error("Error in handlingAiResponse:", error);

    // Return safe fallback using content.text format
    const fallbackMessage = {
      msg: "I'm sorry, I encountered an error processing your request. Please try again.",
    };
    return createAIResponseMessage(fallbackMessage, questionData, "text");
  }
}

/**
 * Build system prompt for AI interaction
 * @param {Object} questionData - Current question data
 * @param {Object} agentData - Agent configuration
 * @param {Object} userData - User data
 * @returns {string} - System prompt
 */
function buildSystemPrompt(questionData, agentData, userData) {
  const basePrompt = `You are an AI assistant helping users with a conversational flow. 

CURRENT CONTEXT:
- Step: ${questionData?.step}
- Step Type: ${questionData?.type_of_message}
- Purpose: ${questionData?.purpose}
- Variable to Collect: ${questionData?.variable || "N/A"}
- Is Mandatory: ${questionData?.mandatory ? "Yes" : "No"}
- Validation Pattern: ${questionData?.regex || "None"}

AGENT PERSONALITY:
${agentData?.ai_character || "You are a helpful and professional assistant."}

GLOBAL RULES:
${
  agentData?.global_rules ||
  "Be helpful, professional, and follow the conversation flow."
}

USER INFORMATION:
- Name: ${userData?.name || "Unknown"}
- Current Step: ${userData?.currentStep || questionData?.step}
- Previous Data: ${JSON.stringify(userData?.capturedData || {})}
- Repeat Count: ${userData?.repeatCount || 0}

STEP CONFIGURATION:
${
  questionData?.message_content?.text
    ? `Expected Response Format: Based on "${questionData.message_content.text}"`
    : ""
}
${
  questionData?.message_content?.options
    ? `Available Options: ${questionData.message_content.options
        .map((opt) => opt.title)
        .join(", ")}`
    : ""
}

INSTRUCTIONS:
Analyze the user's message and determine the most appropriate response type. Consider:

1. **Intent Recognition**: What is the user trying to do?
2. **Input Validation**: Does their input match what's expected for this step?
3. **Context Understanding**: Are they referencing previous steps or asking for help?
4. **Format Transformation**: Can you extract the needed information in the correct format?

RESPONSE TYPES & WHEN TO USE:

**validinput**: Use when the user's input is valid for the current step
- For options: User selected or mentioned a valid option
- For text: Input matches the required format/pattern
- Include "value" with the processed input

**invalidinput**: Use when input doesn't match requirements
- Provide clear explanation of what's expected
- Give examples if helpful
- Be encouraging, not critical

**transform**: Use when you can extract/convert user input to the required format
- Example: "next Tuesday" → "2024-01-16"
- Example: "John Smith" → formatted name
- Always ask for confirmation with the transformed value

**restart**: Use when user clearly wants to start over
- Keywords: "restart", "start again", "begin again"
- Provide option to restart or continue

**escalate**: Use when user needs human help
- Complex questions beyond the flow
- Technical issues
- Emotional distress indicators

**greeting**: Use for casual greetings that don't advance the flow
- "Hi", "Hello", etc. when not at the beginning

**KBquery**: Use for questions that can be answered from knowledge base
- General information requests
- How-to questions

**profanity**: Use when inappropriate content is detected
- Keep response professional and redirect

RESPONSE FORMAT:
Always respond with valid JSON:
{
  "type": "validinput|invalidinput|transform|restart|escalate|KBquery|greeting|profanity",
  "msg": "Your response message to the user",
  "value": "extracted/transformed value (optional)",
  "confidence": 0.8
}

EXAMPLES:

User: "John Doe" (when collecting name)
Response: {"type": "validinput", "msg": "Thank you, John! I've recorded your name.", "value": "John Doe", "confidence": 0.9}

User: "next Friday" (when collecting date)
Response: {"type": "transform", "msg": "I understand you mean Friday, January 19th, 2024. Is that correct?", "value": "2024-01-19", "confidence": 0.8}

User: "I don't understand this"
Response: {"type": "invalidinput", "msg": "I understand this might be confusing. Let me help you. I need you to provide your email address. For example: john@example.com", "confidence": 0.7}

Be conversational, helpful, and always maintain the context of the current step.`;

  return basePrompt;
}

/**
 * Parse and validate AI response
 * @param {string} aiResponse - Raw AI response
 * @returns {Object} - Parsed and validated response
 */
function parseAndValidateAIResponse(aiResponse) {
  try {
    // Extract JSON from response
    const jsonMatch = aiResponse?.match(/{.*}/s);
    if (!jsonMatch) {
      logger.warn("AI response doesn't contain valid JSON, using fallback");
      return {
        type: "invalidinput",
        msg: "I'm sorry, I didn't understand that. Could you please try again?",
        confidence: 0.1,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsed.type) {
      logger.warn("AI response missing 'type' field");
      parsed.type = "invalidinput";
    }

    if (!parsed.msg) {
      logger.warn("AI response missing 'msg' field");
      parsed.msg = "Please provide a valid response.";
    }

    // Validate type is one of the allowed values
    const validTypes = [
      "validinput",
      "invalidinput",
      "transform",
      "restart",
      "escalate",
      "KBquery",
      "greeting",
      "profanity",
    ];

    if (!validTypes.includes(parsed.type)) {
      logger.warn(`AI response has invalid type: ${parsed.type}`);
      parsed.type = "invalidinput";
    }

    // Ensure confidence is between 0 and 1
    if (parsed.confidence !== undefined) {
      parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));
    } else {
      parsed.confidence = 0.5; // Default confidence
    }

    return parsed;
  } catch (error) {
    logger.error("Error parsing AI response:", error);
    return {
      type: "invalidinput",
      msg: "I'm sorry, I encountered an error processing your request. Please try again.",
      confidence: 0.1,
    };
  }
}

/**
 * Get conversation threads/history for user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Conversation history
 */
async function getConversationThreads(userId) {
  try {
    // Fetch recent conversation history from your system
    const Conversation = require("../system/models/Conversation");
    const conversations = await Conversation.query()
      .where("end_user_id", userId)
      .where("status", "active")
      .orderBy("updated_at", "desc")
      .limit(5);
    // Note: metadata is a JSON column, not a relation, so no withGraphFetched needed

    const threads = [];

    // Convert conversation history to thread format
    conversations.forEach((conv) => {
      const variables = conv.metadata?.variables || {};
      Object.entries(variables).forEach(([key, value]) => {
        threads.push({
          role: "assistant",
          content: `Previously captured ${key}: ${value}`,
        });
      });
    });

    return threads.slice(0, 10); // Limit to last 10 interactions
  } catch (error) {
    logger.error("Error getting conversation threads:", error);
    return [];
  }
}

/**
 * Chat completion using GPT
 * @param {Object} conversation - Formatted conversation
 * @returns {Promise<string>} - AI response
 */
async function chatCompletionGPT(conversation) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`GPT API call attempt ${attempt}/${maxRetries}`, {
        model: conversation.model,
        messageCount: conversation.messages?.length,
      }); // Get API key from environment variables with fallbacks
      const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const isAzureOpenAI =
        azureEndpoint &&
        azureEndpoint !== "your_azure_openai_endpoint_here" &&
        azureEndpoint.startsWith("https://") &&
        process.env.AZURE_OPENAI_API_KEY &&
        process.env.AZURE_OPENAI_API_KEY !== "your_azure_openai_api_key_here";

      const apiKey = isAzureOpenAI
        ? process.env.AZURE_OPENAI_API_KEY
        : process.env.OPENAI_API_KEY || process.env.GPT_API_KEY;

      if (!apiKey) {
        const missingKey = isAzureOpenAI
          ? "AZURE_OPENAI_API_KEY"
          : "OPENAI_API_KEY";
        throw new Error(
          `${missingKey} not found in environment variables. Please set the appropriate API key.`,
        );
      } // Determine API endpoint based on key type
      const endpoint = isAzureOpenAI
        ? `${azureEndpoint}/openai/deployments/${
            conversation.model || "gpt-4"
          }/chat/completions?api-version=2024-02-15-preview`
        : "https://api.openai.com/v1/chat/completions";

      const headers = {
        "Content-Type": "application/json",
      };

      // Set authorization header based on API type
      if (isAzureOpenAI) {
        headers["api-key"] = apiKey;
      } else {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      logger.debug("Making API request", {
        endpoint: isAzureOpenAI ? "Azure OpenAI" : "OpenAI",
        model: conversation.model || "gpt-4",
        hasApiKey: !!apiKey,
      });

      const response = await axios.post(
        endpoint,
        {
          model: conversation.model || "gpt-4",
          messages: conversation.messages,
          max_tokens: conversation.max_tokens || 1024,
          temperature: conversation.temperature || 0.7,
        },
        {
          headers,
          timeout: 30000,
        },
      );

      const content = response.data.choices[0]?.message?.content || "";

      logger.info("GPT API call successful", {
        attempt,
        responseLength: content.length,
        usage: response.data.usage,
      });

      return content;
    } catch (error) {
      lastError = error;
      logger.warn(`GPT API attempt ${attempt} failed:`, {
        error: error.message,
        status: error.response?.status,
        willRetry: attempt < maxRetries,
        responseData: error.response?.data,
      });

      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  logger.error("GPT API call failed after all retries:", lastError);
  throw lastError;
}

/**
 * Chat completion using Gemini
 * @param {Object} conversation - Formatted conversation
 * @returns {Promise<string>} - AI response
 */
async function chatCompletionGemini(conversation) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Gemini API key not found in environment variables. Please set GEMINI_API_KEY.",
      );
    }

    // Placeholder for Gemini API integration
    logger.info(
      "Gemini integration not fully implemented yet, falling back to GPT",
    );
    return await chatCompletionGPT(conversation);
  } catch (error) {
    logger.error("Gemini API error:", error);
    throw error;
  }
}

/**
 * Chat completion using Claude
 * @param {Object} conversation - Formatted conversation
 * @returns {Promise<string>} - AI response
 */
async function chatCompletionClaude(conversation) {
  try {
    const apiKey = process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Claude API key not found in environment variables. Please set CLAUDE_API_KEY.",
      );
    }

    // Placeholder for Claude API integration
    logger.info(
      "Claude integration not fully implemented yet, falling back to GPT",
    );
    return await chatCompletionGPT(conversation);
  } catch (error) {
    logger.error("Claude API error:", error);
    throw error;
  }
}

/**
 * Chat completion using Grok
 * @param {Object} conversation - Formatted conversation
 * @returns {Promise<string>} - AI response
 */
async function chatCompletionGrok(conversation) {
  try {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Grok API key not found in environment variables. Please set GROK_API_KEY.",
      );
    }

    // Placeholder for Grok API integration
    logger.info(
      "Grok integration not fully implemented yet, falling back to GPT",
    );
    return await chatCompletionGPT(conversation);
  } catch (error) {
    logger.error("Grok API error:", error);
    throw error;
  }
}

/**
 * Format conversation for GPT
 * @param {string} systemPrompt - System prompt
 * @param {Array} threads - Conversation history
 * @param {Object} aiConfig - AI configuration
 * @returns {Object} - Formatted conversation
 */
function formatGPTConversation(systemPrompt, threads, aiConfig) {
  return {
    model: aiConfig?.model || "gpt-4",
    max_tokens: aiConfig?.max_tokens || 1024,
    temperature: aiConfig?.temperature || 0.7,
    messages: [{ role: "system", content: systemPrompt }, ...threads],
  };
}

/**
 * Format conversation for Gemini
 * @param {string} systemPrompt - System prompt
 * @param {Array} threads - Conversation history
 * @param {Object} aiConfig - AI configuration
 * @returns {Object} - Formatted conversation
 */
function formatGeminiConversation(systemPrompt, threads, aiConfig) {
  // Placeholder implementation
  return formatGPTConversation(systemPrompt, threads, aiConfig);
}

/**
 * Format conversation for Claude
 * @param {string} systemPrompt - System prompt
 * @param {Array} threads - Conversation history
 * @param {Object} aiConfig - AI configuration
 * @returns {Object} - Formatted conversation
 */
function formatClaudeConversation(systemPrompt, threads, aiConfig) {
  // Placeholder implementation
  return formatGPTConversation(systemPrompt, threads, aiConfig);
}

/**
 * Format conversation for Grok
 * @param {string} systemPrompt - System prompt
 * @param {Array} threads - Conversation history
 * @param {Object} aiConfig - AI configuration
 * @returns {Object} - Formatted conversation
 */
function formatGrokConversation(systemPrompt, threads, aiConfig) {
  // Placeholder implementation
  return formatGPTConversation(systemPrompt, threads, aiConfig);
}

/**
 * Store pending data for user confirmation
 * @param {string} userId - User ID
 * @param {Object} pendingData - Data to store
 * @returns {Promise<void>}
 */
async function storePendingData(userId, pendingData) {
  try {
    // Store pending data in conversation metadata
    const Conversation = require("../system/models/Conversation");

    const conversation = await Conversation.query()
      .where("end_user_id", userId)
      .where("status", "active")
      .first();

    if (conversation) {
      await Conversation.query().patchAndFetchById(conversation.id, {
        metadata: {
          ...conversation.metadata,
          pendingData: pendingData,
          pendingDataTimestamp: new Date().toISOString(),
        },
      });

      logger.info("Stored pending data for user:", { userId, pendingData });
    }
  } catch (error) {
    logger.error("Error storing pending data:", error);
  }
}

/**
 * Process valid option selection
 * @param {Object} userData - User data
 * @param {Object} option - Selected option
 * @param {Object} questionData - Question data
 * @param {Object} flowData - Flow data
 * @returns {Promise<Object>} - Response
 */
async function processValidOption(userData, option, questionData, flowData) {
  try {
    // Import flow manager functions
    const { generateStepResponse } = require("./conversationFlowService");

    logger.info("Processing valid option:", { option: option.title });

    // Return the step that the option points to
    const nextStep = option.postbackText?.split("/")[0];

    if (nextStep && nextStep !== "stop") {
      // Get the next step configuration
      const { getNodesByAgentAndStep } = require("../api/Agents/service");
      const nextStepNode = await getNodesByAgentAndStep(
        questionData.agent_id,
        nextStep,
      );

      if (nextStepNode) {
        return generateStepResponse(
          Array.isArray(nextStepNode) ? nextStepNode[0] : nextStepNode,
          userData.capturedData || {},
        );
      }
    }

    return {
      type: "text",
      text: `Thank you for selecting "${option.title}". Let me process that for you.`,
    };
  } catch (error) {
    logger.error("Error processing valid option:", error);
    throw error;
  }
}

/**
 * Process text input
 * @param {Object} userData - User data
 * @param {string} textValue - Text value
 * @param {Object} questionData - Question data
 * @param {Object} flowData - Flow data
 * @returns {Promise<Object>} - Response
 */
async function processTextInput(userData, textValue, questionData, flowData) {
  try {
    // Import flow management functions
    const {
      updateConversationStep,
      generateStepResponse,
    } = require("./conversationFlowService");
    const { getNodesByAgentAndStep } = require("../api/Agents/service");

    logger.info("Processing text input:", { textValue });

    // If this step has a variable, store the value
    if (questionData.variable) {
      await updateConversationStep(userData.conversationId, questionData.step, {
        variable: questionData.variable,
        value: textValue,
      });
    }

    // Get next step
    const nextStepIdentifier = questionData.next_possible_steps?.[0];

    if (nextStepIdentifier && nextStepIdentifier !== "stop") {
      const nextStepNode = await getNodesByAgentAndStep(
        questionData.agent_id,
        nextStepIdentifier,
      );

      if (nextStepNode) {
        const updatedVariables = {
          ...userData.capturedData,
          [questionData.variable]: textValue,
        };

        return generateStepResponse(
          Array.isArray(nextStepNode) ? nextStepNode[0] : nextStepNode,
          updatedVariables,
        );
      }
    }

    return {
      type: "text",
      text: `Thank you for providing: "${textValue}". Your information has been recorded.`,
    };
  } catch (error) {
    logger.error("Error processing text input:", error);
    throw error;
  }
}

/**
 * Escalate conversation to human agent
 * @param {Object} userData - User data
 * @param {Object} questionData - Question data
 * @returns {Promise<void>}
 */
async function escalateToHuman(userData, questionData) {
  try {
    // Update conversation status to indicate human handoff needed
    const Conversation = require("../system/models/Conversation");

    const conversation = await Conversation.query()
      .where("end_user_id", userData.userId)
      .where("status", "active")
      .first();

    if (conversation) {
      await Conversation.query().patchAndFetchById(conversation.id, {
        metadata: {
          ...conversation.metadata,
          escalation_requested: true,
          escalation_reason: "AI requested human assistance",
          escalation_timestamp: new Date().toISOString(),
          escalation_step: questionData?.step,
        },
      });

      // Track escalation event
      const { trackConversationEvent } = require("./analytics");
      const { EVENT_TYPES } = require("./config");

      await trackConversationEvent(
        conversation.id,
        EVENT_TYPES.ESCALATION_TRIGGERED,
        {
          step: questionData?.step,
          reason: "AI requested human assistance",
          ai_confidence: 0.1,
        },
      );

      logger.info("Escalated conversation to human agent:", {
        userId: userData?.userId,
        conversationId: conversation.id,
        step: questionData?.step,
      });
    }
  } catch (error) {
    logger.error("Error escalating to human:", error);
  }
}

/**
 * Handle confirmation response for AI transformed data
 * @param {Object} userData - User data
 * @param {string} confirmation - "confirm_yes" or "confirm_no"
 * @param {Object} questionData - Question data
 * @returns {Promise<Object>} - Response
 */
async function handleConfirmation(userData, confirmation, questionData) {
  try {
    const Conversation = require("../system/models/Conversation");

    // Get pending data from conversation
    const conversation = await Conversation.query()
      .where("end_user_id", userData.userId)
      .where("status", "active")
      .first();

    const pendingData = conversation?.metadata?.pendingData;

    if (!pendingData) {
      return {
        type: "text",
        text: "I'm sorry, I don't have any pending data to confirm. Please try again.",
      };
    }

    if (confirmation === "confirm_yes") {
      // User confirmed the AI transformation
      const {
        updateConversationStep,
        generateStepResponse,
      } = require("./conversationFlowService");
      const { getNodesByAgentAndStep } = require("../api/Agents/service");

      // Store the confirmed value
      await updateConversationStep(conversation.id, pendingData.step, {
        variable: pendingData.variable,
        value: pendingData.value,
      });

      // Clear pending data
      await Conversation.query().patchAndFetchById(conversation.id, {
        metadata: {
          ...conversation.metadata,
          pendingData: null,
          pendingDataTimestamp: null,
        },
      });

      // Get next step
      const nextStepIdentifier = questionData.next_possible_steps?.[0];

      if (nextStepIdentifier && nextStepIdentifier !== "stop") {
        const nextStepNode = await getNodesByAgentAndStep(
          questionData.agent_id,
          nextStepIdentifier,
        );

        if (nextStepNode) {
          const updatedVariables = {
            ...userData.capturedData,
            [pendingData.variable]: pendingData.value,
          };

          return generateStepResponse(
            Array.isArray(nextStepNode) ? nextStepNode[0] : nextStepNode,
            updatedVariables,
          );
        }
      }

      return {
        type: "text",
        text: `Thank you for confirming. I've recorded: ${pendingData.variable} = ${pendingData.value}`,
      };
    } else {
      // User rejected the AI transformation
      // Clear pending data and ask again
      await Conversation.query().patchAndFetchById(conversation.id, {
        metadata: {
          ...conversation.metadata,
          pendingData: null,
          pendingDataTimestamp: null,
        },
      });

      return {
        type: "text",
        text: `No problem. ${
          questionData.message_content?.text ||
          "Please provide your response again."
        }`,
      };
    }
  } catch (error) {
    logger.error("Error handling confirmation:", error);
    return {
      type: "text",
      text: "I'm sorry, there was an error processing your confirmation. Please try again.",
    };
  }
}

module.exports = {
  getPromptByBotName,
  handlingAiResponse,
  handleConfirmation,
  chatCompletionGPT,
  chatCompletionGemini,
  chatCompletionClaude,
  chatCompletionGrok,
};
