// AgentsFlow/aiProcessor.js
const logger = require("../system/utils/logger");
const { trackConversationEvent } = require("./analytics");
const { EVENT_TYPES } = require("./config");

/**
 * AI Processing module for conversation analysis and enhancement
 */

/**
 * Process user message through AI for analysis and enhancement
 * @param {Object} messageData - User message data
 * @param {Object} conversationContext - Current conversation context
 * @param {Object} agentConfig - Agent AI configuration
 * @returns {Promise<Object>} - AI analysis results
 */
async function processUserMessage(
  messageData,
  conversationContext,
  agentConfig,
) {
  try {
    // Check if AI processing is enabled for this agent
    if (!agentConfig?.ai_config?.enabled) {
      logger.debug("AI processing disabled for agent");
      return {
        processed: false,
        reason: "AI processing disabled",
        originalMessage: messageData,
      };
    }

    const aiConfig = agentConfig.ai_config;
    const startTime = Date.now();

    // Prepare AI analysis payload
    const analysisPayload = {
      message: {
        text: messageData.text,
        type: messageData.type,
        attachments: messageData.attachments,
      },
      context: {
        currentStep: conversationContext.current_step,
        conversationHistory: conversationContext.history || [],
        userProfile: conversationContext.userProfile || {},
        agentPersonality: agentConfig.ai_character || "helpful assistant",
      },
      analysis_type: aiConfig.analysis_type || "intent_extraction",
    };

    // Perform AI analysis based on configuration
    let analysisResult = {};

    switch (aiConfig.analysis_type) {
      case "intent_extraction":
        analysisResult = await extractUserIntent(analysisPayload, aiConfig);
        break;

      case "sentiment_analysis":
        analysisResult = await analyzeSentiment(analysisPayload, aiConfig);
        break;

      case "entity_recognition":
        analysisResult = await recognizeEntities(analysisPayload, aiConfig);
        break;

      case "content_moderation":
        analysisResult = await moderateContent(analysisPayload, aiConfig);
        break;

      case "comprehensive":
        analysisResult = await performComprehensiveAnalysis(
          analysisPayload,
          aiConfig,
        );
        break;

      default:
        analysisResult = await performBasicAnalysis(analysisPayload, aiConfig);
    }

    const processingTime = Date.now() - startTime;

    // Track AI processing event
    if (conversationContext.conversation_id) {
      await trackConversationEvent(
        conversationContext.conversation_id,
        EVENT_TYPES.AI_PROCESSING_COMPLETED,
        {
          analysis_type: aiConfig.analysis_type,
          processing_time_ms: processingTime,
          confidence_score: analysisResult.confidence || 0,
        },
      );
    }

    return {
      processed: true,
      analysis: analysisResult,
      processing_time_ms: processingTime,
      enhanced_message: enhanceMessageWithAI(messageData, analysisResult),
    };
  } catch (error) {
    logger.error("Error in AI processing:", error);

    // Track AI processing error
    if (conversationContext.conversation_id) {
      await trackConversationEvent(
        conversationContext.conversation_id,
        EVENT_TYPES.ERROR_OCCURRED,
        {
          error_type: "ai_processing_error",
          error_message: error.message,
        },
      );
    }

    // Return original message if AI processing fails
    return {
      processed: false,
      error: error.message,
      originalMessage: messageData,
    };
  }
}

/**
 * Extract user intent from message
 * @param {Object} payload - Analysis payload
 * @param {Object} aiConfig - AI configuration
 * @returns {Promise<Object>} - Intent analysis result
 */
async function extractUserIntent(payload, aiConfig) {
  try {
    // Implement intent extraction logic
    // This would typically call an AI service like OpenAI, Azure Cognitive Services, etc.

    const intents = [
      "greeting",
      "question",
      "complaint",
      "request",
      "booking",
      "cancellation",
      "information",
      "support",
      "feedback",
      "goodbye",
    ];

    // Simple keyword-based intent detection (replace with actual AI service)
    const messageText = payload.message.text.toLowerCase();
    let detectedIntent = "unknown";
    let confidence = 0.5;

    for (const intent of intents) {
      const keywords = getIntentKeywords(intent);
      for (const keyword of keywords) {
        if (messageText.includes(keyword)) {
          detectedIntent = intent;
          confidence = 0.8;
          break;
        }
      }
      if (detectedIntent !== "unknown") break;
    }

    return {
      intent: detectedIntent,
      confidence: confidence,
      keywords_matched: extractKeywords(messageText),
      suggested_response_tone: getSuggestedTone(detectedIntent),
    };
  } catch (error) {
    logger.error("Error in intent extraction:", error);
    throw error;
  }
}

/**
 * Analyze message sentiment
 * @param {Object} payload - Analysis payload
 * @param {Object} aiConfig - AI configuration
 * @returns {Promise<Object>} - Sentiment analysis result
 */
async function analyzeSentiment(payload, aiConfig) {
  try {
    // Implement sentiment analysis logic
    const messageText = payload.message.text.toLowerCase();

    // Simple sentiment detection (replace with actual AI service)
    const positiveWords = [
      "good",
      "great",
      "excellent",
      "happy",
      "satisfied",
      "love",
      "amazing",
    ];
    const negativeWords = [
      "bad",
      "terrible",
      "awful",
      "angry",
      "frustrated",
      "hate",
      "disappointed",
    ];

    let positiveScore = 0;
    let negativeScore = 0;

    positiveWords.forEach((word) => {
      if (messageText.includes(word)) positiveScore++;
    });

    negativeWords.forEach((word) => {
      if (messageText.includes(word)) negativeScore++;
    });

    let sentiment = "neutral";
    let confidence = 0.6;

    if (positiveScore > negativeScore) {
      sentiment = "positive";
      confidence = Math.min(0.9, 0.6 + positiveScore * 0.1);
    } else if (negativeScore > positiveScore) {
      sentiment = "negative";
      confidence = Math.min(0.9, 0.6 + negativeScore * 0.1);
    }

    return {
      sentiment: sentiment,
      confidence: confidence,
      positive_score: positiveScore,
      negative_score: negativeScore,
      emotion_indicators: extractEmotionIndicators(messageText),
    };
  } catch (error) {
    logger.error("Error in sentiment analysis:", error);
    throw error;
  }
}

/**
 * Recognize entities in message
 * @param {Object} payload - Analysis payload
 * @param {Object} aiConfig - AI configuration
 * @returns {Promise<Object>} - Entity recognition result
 */
async function recognizeEntities(payload, aiConfig) {
  try {
    const messageText = payload.message.text;
    const entities = [];

    // Simple entity recognition patterns (replace with actual AI service)
    const patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /(\+\d{1,3}[- ]?)?\d{10,}/g,
      date: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g,
      time: /\b\d{1,2}:\d{2}(\s?(AM|PM))?\b/gi,
      number: /\b\d+\b/g,
    };

    Object.entries(patterns).forEach(([type, pattern]) => {
      const matches = messageText.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          entities.push({
            type: type,
            value: match,
            confidence: 0.8,
          });
        });
      }
    });

    return {
      entities: entities,
      entity_count: entities.length,
      recognized_types: [...new Set(entities.map((e) => e.type))],
    };
  } catch (error) {
    logger.error("Error in entity recognition:", error);
    throw error;
  }
}

/**
 * Moderate content for inappropriate material
 * @param {Object} payload - Analysis payload
 * @param {Object} aiConfig - AI configuration
 * @returns {Promise<Object>} - Content moderation result
 */
async function moderateContent(payload, aiConfig) {
  try {
    const messageText = payload.message.text.toLowerCase();

    // Simple content moderation (replace with actual AI service)
    const inappropriateWords = [
      "spam",
      "scam",
      "fraud",
      "fake",
      "lie",
      "cheat",
      // Add more as needed - this is a basic implementation
    ];

    const flaggedWords = [];
    inappropriateWords.forEach((word) => {
      if (messageText.includes(word)) {
        flaggedWords.push(word);
      }
    });

    const isAppropriate = flaggedWords.length === 0;
    const risk_level =
      flaggedWords.length === 0
        ? "low"
        : flaggedWords.length <= 2
        ? "medium"
        : "high";

    return {
      is_appropriate: isAppropriate,
      risk_level: risk_level,
      flagged_words: flaggedWords,
      confidence: 0.7,
      requires_review: !isAppropriate,
    };
  } catch (error) {
    logger.error("Error in content moderation:", error);
    throw error;
  }
}

/**
 * Perform comprehensive AI analysis
 * @param {Object} payload - Analysis payload
 * @param {Object} aiConfig - AI configuration
 * @returns {Promise<Object>} - Comprehensive analysis result
 */
async function performComprehensiveAnalysis(payload, aiConfig) {
  try {
    const [intentResult, sentimentResult, entityResult, moderationResult] =
      await Promise.all([
        extractUserIntent(payload, aiConfig),
        analyzeSentiment(payload, aiConfig),
        recognizeEntities(payload, aiConfig),
        moderateContent(payload, aiConfig),
      ]);

    return {
      intent: intentResult,
      sentiment: sentimentResult,
      entities: entityResult,
      moderation: moderationResult,
      overall_confidence: calculateOverallConfidence([
        intentResult.confidence,
        sentimentResult.confidence,
        moderationResult.confidence,
      ]),
    };
  } catch (error) {
    logger.error("Error in comprehensive analysis:", error);
    throw error;
  }
}

/**
 * Perform basic AI analysis
 * @param {Object} payload - Analysis payload
 * @param {Object} aiConfig - AI configuration
 * @returns {Promise<Object>} - Basic analysis result
 */
async function performBasicAnalysis(payload, aiConfig) {
  try {
    const messageText = payload.message.text;

    return {
      message_length: messageText.length,
      word_count: messageText.split(/\s+/).length,
      has_question: messageText.includes("?"),
      has_greeting:
        /^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(
          messageText.trim(),
        ),
      language_detected: "en", // Simple default
      confidence: 0.6,
    };
  } catch (error) {
    logger.error("Error in basic analysis:", error);
    throw error;
  }
}

/**
 * Enhance message with AI analysis results
 * @param {Object} originalMessage - Original message data
 * @param {Object} analysisResult - AI analysis result
 * @returns {Object} - Enhanced message
 */
function enhanceMessageWithAI(originalMessage, analysisResult) {
  return {
    ...originalMessage,
    ai_analysis: analysisResult,
    enhanced_at: new Date().toISOString(),
  };
}

/**
 * Get intent keywords for detection
 * @param {string} intent - Intent name
 * @returns {Array} - Keywords array
 */
function getIntentKeywords(intent) {
  const intentKeywords = {
    greeting: [
      "hi",
      "hello",
      "hey",
      "good morning",
      "good afternoon",
      "good evening",
    ],
    question: ["what", "how", "when", "where", "why", "which", "?"],
    complaint: ["problem", "issue", "wrong", "error", "bad", "terrible"],
    request: ["can you", "please", "need", "want", "would like"],
    booking: ["book", "reserve", "appointment", "schedule"],
    cancellation: ["cancel", "remove", "delete", "stop"],
    information: ["info", "information", "tell me", "explain"],
    support: ["help", "support", "assist", "stuck"],
    feedback: ["feedback", "review", "opinion", "think"],
    goodbye: ["bye", "goodbye", "see you", "talk later"],
  };

  return intentKeywords[intent] || [];
}

/**
 * Extract keywords from text
 * @param {string} text - Text to analyze
 * @returns {Array} - Extracted keywords
 */
function extractKeywords(text) {
  // Simple keyword extraction (replace with more sophisticated NLP)
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = [
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
  ];

  return words
    .filter((word) => word.length > 2 && !stopWords.includes(word))
    .slice(0, 5); // Return top 5 keywords
}

/**
 * Get suggested response tone based on intent
 * @param {string} intent - Detected intent
 * @returns {string} - Suggested tone
 */
function getSuggestedTone(intent) {
  const toneMapping = {
    greeting: "friendly",
    question: "informative",
    complaint: "empathetic",
    request: "helpful",
    booking: "professional",
    cancellation: "understanding",
    information: "clear",
    support: "supportive",
    feedback: "appreciative",
    goodbye: "warm",
  };

  return toneMapping[intent] || "neutral";
}

/**
 * Extract emotion indicators from text
 * @param {string} text - Text to analyze
 * @returns {Array} - Emotion indicators
 */
function extractEmotionIndicators(text) {
  const emotionPatterns = {
    excitement: ["!", "wow", "amazing", "awesome"],
    frustration: ["ugh", "argh", "seriously", "come on"],
    confusion: ["?", "huh", "what", "confused"],
    satisfaction: ["thanks", "perfect", "exactly", "great"],
  };

  const indicators = [];
  Object.entries(emotionPatterns).forEach(([emotion, patterns]) => {
    patterns.forEach((pattern) => {
      if (text.toLowerCase().includes(pattern)) {
        indicators.push(emotion);
      }
    });
  });

  return [...new Set(indicators)]; // Remove duplicates
}

/**
 * Calculate overall confidence from multiple scores
 * @param {Array} scores - Array of confidence scores
 * @returns {number} - Overall confidence
 */
function calculateOverallConfidence(scores) {
  const validScores = scores.filter(
    (score) => typeof score === "number" && score >= 0 && score <= 1,
  );
  if (validScores.length === 0) return 0.5;

  return (
    validScores.reduce((sum, score) => sum + score, 0) / validScores.length
  );
}

module.exports = {
  processUserMessage,
  extractUserIntent,
  analyzeSentiment,
  recognizeEntities,
  moderateContent,
  performComprehensiveAnalysis,
  performBasicAnalysis,
  enhanceMessageWithAI,
};
