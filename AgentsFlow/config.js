// AgentsFlow/config.js
/**
 * Configuration settings for conversation flow system
 */

const FLOW_CONFIG = {
  // Validation settings
  validation: {
    maxRetries: 3,
    timeoutSeconds: 300, // 5 minutes
    enableFallback: true,
    fallbackMessage:
      "I'm having trouble understanding. Let me connect you with a human agent.",
  },

  // Flow behavior settings
  flow: {
    enableProgressSaving: true,
    enableAnalytics: true,
    maxStepsPerConversation: 50,
    conversationTimeoutMinutes: 30,
  },

  // Message settings
  messages: {
    maxMessageLength: 4096,
    enableRichMedia: true,
    supportedTypes: ["text", "quick_reply", "list", "button"],
    enableEmojis: true,
  },

  // Error handling
  errors: {
    enableGracefulDegradation: true,
    logLevel: "error",
    notifyOnFailures: true,
    maxErrorsBeforeEscalation: 5,
  },

  // Performance settings
  performance: {
    enableCaching: true,
    cacheTimeoutMinutes: 10,
    enableParallelProcessing: false,
    maxConcurrentConversations: 1000,
  },
};

/**
 * Default error messages for different scenarios
 */
const ERROR_MESSAGES = {
  validation: {
    required: "This field is required. Please provide a response.",
    format: "Please enter a valid response according to the required format.",
    option: "Please select one of the provided options.",
    regex: "Please enter a valid response according to the required format.",
    timeout: "I didn't receive a response in time. Let's start over.",
  },
  system: {
    agentNotFound:
      "I'm having trouble processing your request. Please try again.",
    stepNotFound:
      "Sorry, I'm having trouble processing your request right now.",
    generalError: "I apologize, but I encountered an error. Please try again.",
    timeout: "The conversation has timed out. Please start a new conversation.",
    strict_validation_failed:
      "I'm sorry, but the service you're trying to access is not available through this broadcast. Please check the available options or contact support.",
  },

  flow: {
    completed: "Thank you! Your conversation has been completed successfully.",
    abandoned:
      "It looks like you've stepped away. Feel free to start a new conversation anytime.",
    escalated:
      "Let me connect you with a human agent who can better assist you.",
  },
};

/**
 * Conversation states and their descriptions
 */
const CONVERSATION_STATES = {
  PENDING: "pending",
  ACTIVE: "active",
  WAITING: "waiting",
  COMPLETED: "completed",
  ABANDONED: "abandoned",
  ESCALATED: "escalated",
  ERROR: "error",
};

/**
 * Event types for analytics tracking
 */
const EVENT_TYPES = {
  CONVERSATION_STARTED: "conversation_started",
  STEP_COMPLETED: "step_completed",
  VALIDATION_FAILED: "validation_failed",
  VALIDATION_SUCCEEDED: "validation_succeeded",
  FLOW_COMPLETED: "flow_completed",
  FLOW_ABANDONED: "flow_abandoned",
  ERROR_OCCURRED: "error_occurred",
  TIMEOUT_OCCURRED: "timeout_occurred",
  ESCALATION_TRIGGERED: "escalation_triggered",
  AI_PROCESSING_COMPLETED: "ai_processing_completed",
  AI_PROCESSING_FAILED: "ai_processing_failed",
};

/**
 * Message types supported by the system
 */
const MESSAGE_TYPES = {
  TEXT: "text",
  QUICK_REPLY: "quick_reply",
  LIST: "list",
  BUTTON: "button",
  IMAGE: "image",
  DOCUMENT: "document",
  INTERACTIVE: "interactive",
};

/**
 * Validation types
 */
const VALIDATION_TYPES = {
  REGEX: "regex_match",
  OPTION: "option_match",
  REQUIRED: "required_field",
  FORMAT: "format_validation",
  CUSTOM: "custom_validation",
};

/**
 * Get environment-specific configuration
 * @param {string} env - Environment (development, staging, production)
 * @returns {Object} - Environment configuration
 */
function getEnvironmentConfig(env = process.env.NODE_ENV || "development") {
  const envConfigs = {
    development: {
      ...FLOW_CONFIG,
      errors: {
        ...FLOW_CONFIG.errors,
        logLevel: "debug",
      },
      performance: {
        ...FLOW_CONFIG.performance,
        enableCaching: false,
      },
    },

    staging: {
      ...FLOW_CONFIG,
      validation: {
        ...FLOW_CONFIG.validation,
        maxRetries: 5,
      },
    },

    production: {
      ...FLOW_CONFIG,
      errors: {
        ...FLOW_CONFIG.errors,
        logLevel: "error",
        notifyOnFailures: true,
      },
      performance: {
        ...FLOW_CONFIG.performance,
        enableCaching: true,
        maxConcurrentConversations: 5000,
      },
    },
  };
  return envConfigs[env] || envConfigs.development;
}

module.exports = {
  FLOW_CONFIG,
  ERROR_MESSAGES,
  CONVERSATION_STATES,
  EVENT_TYPES,
  MESSAGE_TYPES,
  VALIDATION_TYPES,
  getEnvironmentConfig,
};
