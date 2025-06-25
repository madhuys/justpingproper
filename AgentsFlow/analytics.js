// AgentsFlow/analytics.js
const logger = require("../system/utils/logger");
const Conversation = require("../system/models/Conversation");
const Message = require("../system/models/Message");
const Agent = require("../system/models/Agent");

/**
 * Track conversation flow analytics
 * @param {string} conversationId - Conversation ID
 * @param {string} eventType - Type of event (step_completed, validation_failed, flow_completed, etc.)
 * @param {Object} eventData - Additional event data
 */
async function trackConversationEvent(
  conversationId,
  eventType,
  eventData = {},
) {
  try {
    const conversation = await Conversation.query().findById(conversationId);

    if (!conversation) {
      logger.warn(`Conversation not found for analytics: ${conversationId}`);
      return;
    }

    const existingMetadata = conversation.metadata || {};
    const analytics = existingMetadata.analytics || {};
    const events = analytics.events || [];

    // Add new event
    events.push({
      type: eventType,
      timestamp: new Date().toISOString(),
      step: conversation.current_step,
      data: eventData,
    });

    // Update analytics metrics
    const updatedAnalytics = {
      ...analytics,
      events,
      total_events: events.length,
      last_event_at: new Date().toISOString(),
      step_counts: calculateStepCounts(events),
      completion_rate: calculateCompletionRate(events),
      average_response_time: calculateAverageResponseTime(events),
    };

    // Update conversation with analytics
    await Conversation.query().patchAndFetchById(conversationId, {
      metadata: {
        ...existingMetadata,
        analytics: updatedAnalytics,
      },
    });

    logger.debug(
      `Tracked event ${eventType} for conversation ${conversationId}`,
    );
  } catch (error) {
    logger.error(`Error tracking conversation event: ${error.message}`, error);
  }
}

/**
 * Generate conversation flow analytics report
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Object>} - Analytics report
 */
async function generateConversationAnalytics(filters = {}) {
  try {
    const { startDate, endDate, agentId, businessChannelId, status } = filters;

    let query = Conversation.query().withGraphFetched(
      "[agent, endUser, businessChannel]",
    );

    // Apply filters
    if (startDate) {
      query = query.where("created_at", ">=", startDate);
    }
    if (endDate) {
      query = query.where("created_at", "<=", endDate);
    }
    if (agentId) {
      query = query.where("agent_id", agentId);
    }
    if (businessChannelId) {
      query = query.where("business_channel_id", businessChannelId);
    }
    if (status) {
      query = query.where("status", status);
    }

    const conversations = await query;

    // Calculate analytics metrics
    const analytics = {
      total_conversations: conversations.length,
      completed_conversations: conversations.filter(
        (c) => c.status === "completed",
      ).length,
      active_conversations: conversations.filter((c) => c.status === "active")
        .length,
      abandoned_conversations: conversations.filter(
        (c) => c.status === "abandoned",
      ).length,

      completion_rate: 0,
      average_steps_per_conversation: 0,
      most_common_exit_points: {},
      agent_performance: {},
      daily_conversation_counts: {},

      step_analytics: calculateStepAnalytics(conversations),
      validation_analytics: calculateValidationAnalytics(conversations),
      timing_analytics: calculateTimingAnalytics(conversations),
    };

    // Calculate completion rate
    if (analytics.total_conversations > 0) {
      analytics.completion_rate =
        (analytics.completed_conversations / analytics.total_conversations) *
        100;
    }

    // Calculate average steps
    const totalSteps = conversations.reduce((sum, conv) => {
      const events = conv.metadata?.analytics?.events || [];
      return sum + events.filter((e) => e.type === "step_completed").length;
    }, 0);

    if (analytics.total_conversations > 0) {
      analytics.average_steps_per_conversation =
        totalSteps / analytics.total_conversations;
    }

    // Agent performance analytics
    const agentGroups = conversations.reduce((groups, conv) => {
      const agentId = conv.agent_id;
      if (agentId) {
        if (!groups[agentId]) {
          groups[agentId] = {
            agent_name: conv.agent?.name || "Unknown",
            total_conversations: 0,
            completed_conversations: 0,
            completion_rate: 0,
          };
        }
        groups[agentId].total_conversations++;
        if (conv.status === "completed") {
          groups[agentId].completed_conversations++;
        }
        groups[agentId].completion_rate =
          (groups[agentId].completed_conversations /
            groups[agentId].total_conversations) *
          100;
      }
      return groups;
    }, {});

    analytics.agent_performance = agentGroups;

    return analytics;
  } catch (error) {
    logger.error(
      `Error generating conversation analytics: ${error.message}`,
      error,
    );
    throw error;
  }
}

/**
 * Calculate step completion counts
 * @param {Array} events - Event array
 * @returns {Object} - Step counts
 */
function calculateStepCounts(events) {
  const stepCounts = {};
  events.forEach((event) => {
    if (event.type === "step_completed" && event.step) {
      stepCounts[event.step] = (stepCounts[event.step] || 0) + 1;
    }
  });
  return stepCounts;
}

/**
 * Calculate completion rate from events
 * @param {Array} events - Event array
 * @returns {number} - Completion rate percentage
 */
function calculateCompletionRate(events) {
  const totalSteps = events.filter((e) => e.type === "step_completed").length;
  const completedFlows = events.filter(
    (e) => e.type === "flow_completed",
  ).length;

  if (totalSteps === 0) return 0;
  return (completedFlows / totalSteps) * 100;
}

/**
 * Calculate average response time
 * @param {Array} events - Event array
 * @returns {number} - Average response time in seconds
 */
function calculateAverageResponseTime(events) {
  const responseTimes = [];

  for (let i = 1; i < events.length; i++) {
    const currentEvent = events[i];
    const previousEvent = events[i - 1];

    if (currentEvent.type === "step_completed" && previousEvent.timestamp) {
      const timeDiff =
        new Date(currentEvent.timestamp) - new Date(previousEvent.timestamp);
      responseTimes.push(timeDiff / 1000); // Convert to seconds
    }
  }

  if (responseTimes.length === 0) return 0;
  return (
    responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
  );
}

/**
 * Calculate step analytics across conversations
 * @param {Array} conversations - Conversations array
 * @returns {Object} - Step analytics
 */
function calculateStepAnalytics(conversations) {
  const stepData = {};

  conversations.forEach((conv) => {
    const events = conv.metadata?.analytics?.events || [];
    events.forEach((event) => {
      if (event.step) {
        if (!stepData[event.step]) {
          stepData[event.step] = {
            total_visits: 0,
            completions: 0,
            validations_failed: 0,
            average_time_spent: 0,
          };
        }

        stepData[event.step].total_visits++;

        if (event.type === "step_completed") {
          stepData[event.step].completions++;
        } else if (event.type === "validation_failed") {
          stepData[event.step].validations_failed++;
        }
      }
    });
  });

  return stepData;
}

/**
 * Calculate validation analytics
 * @param {Array} conversations - Conversations array
 * @returns {Object} - Validation analytics
 */
function calculateValidationAnalytics(conversations) {
  let totalValidations = 0;
  let failedValidations = 0;
  const validationTypes = {};

  conversations.forEach((conv) => {
    const events = conv.metadata?.analytics?.events || [];
    events.forEach((event) => {
      if (event.type === "validation_attempted") {
        totalValidations++;

        const validationType = event.data?.validation_type || "unknown";
        if (!validationTypes[validationType]) {
          validationTypes[validationType] = { total: 0, failed: 0 };
        }
        validationTypes[validationType].total++;

        if (event.data?.failed) {
          failedValidations++;
          validationTypes[validationType].failed++;
        }
      }
    });
  });

  return {
    total_validations: totalValidations,
    failed_validations: failedValidations,
    validation_success_rate:
      totalValidations > 0
        ? ((totalValidations - failedValidations) / totalValidations) * 100
        : 0,
    validation_types: validationTypes,
  };
}

/**
 * Calculate timing analytics
 * @param {Array} conversations - Conversations array
 * @returns {Object} - Timing analytics
 */
function calculateTimingAnalytics(conversations) {
  const conversationDurations = [];
  const stepDurations = [];

  conversations.forEach((conv) => {
    if (conv.created_at && conv.metadata?.completed_at) {
      const duration =
        new Date(conv.metadata.completed_at) - new Date(conv.created_at);
      conversationDurations.push(duration / 1000); // Convert to seconds
    }

    const events = conv.metadata?.analytics?.events || [];
    for (let i = 1; i < events.length; i++) {
      const timeDiff =
        new Date(events[i].timestamp) - new Date(events[i - 1].timestamp);
      stepDurations.push(timeDiff / 1000);
    }
  });

  return {
    average_conversation_duration:
      conversationDurations.length > 0
        ? conversationDurations.reduce((sum, dur) => sum + dur, 0) /
          conversationDurations.length
        : 0,
    average_step_duration:
      stepDurations.length > 0
        ? stepDurations.reduce((sum, dur) => sum + dur, 0) /
          stepDurations.length
        : 0,
    total_conversations_with_timing: conversationDurations.length,
  };
}

module.exports = {
  trackConversationEvent,
  generateConversationAnalytics,
};
