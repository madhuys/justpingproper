// AgentsFlow/utils.js
const logger = require("../system/utils/logger");
const Conversation = require("../system/models/Conversation");
const Agent = require("../system/models/Agent");
const AgentNode = require("../system/models/AgentNode");
const { generateConversationAnalytics } = require("./analytics");
const { CONVERSATION_STATES, EVENT_TYPES } = require("./config");

/**
 * Utility functions for conversation flow management
 */

/**
 * Get conversation summary for admin/debug purposes
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} - Conversation summary
 */
async function getConversationSummary(conversationId) {
  try {
    const conversation = await Conversation.query()
      .findById(conversationId)
      .withGraphFetched("[endUser, agent, businessChannel, broadcast]");

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const metadata = conversation.metadata || {};
    const analytics = metadata.analytics || {};
    const capturedVariables = metadata.captured_variables || {};

    return {
      id: conversation.id,
      status: conversation.status,
      currentStep: conversation.current_step,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,

      user: {
        id: conversation.endUser?.id,
        phone: conversation.endUser?.phone,
        name: conversation.endUser?.name,
      },

      agent: {
        id: conversation.agent?.id,
        name: conversation.agent?.name,
        type: conversation.agent?.type,
      },

      channel: {
        id: conversation.businessChannel?.id,
        name: conversation.businessChannel?.name,
        provider: conversation.businessChannel?.provider_name,
      },

      broadcast: conversation.broadcast
        ? {
            id: conversation.broadcast.id,
            name: conversation.broadcast.name,
          }
        : null,

      progress: {
        capturedVariables,
        totalEvents: analytics.events?.length || 0,
        lastEventAt: analytics.last_event_at,
        completionRate: analytics.completion_rate || 0,
      },

      analytics: {
        events: analytics.events || [],
        stepCounts: analytics.step_counts || {},
        averageResponseTime: analytics.average_response_time || 0,
      },
    };
  } catch (error) {
    logger.error(`Error getting conversation summary: ${error.message}`, error);
    throw error;
  }
}

/**
 * Reset conversation to a specific step
 * @param {string} conversationId - Conversation ID
 * @param {string} step - Step to reset to
 * @param {Object} options - Reset options
 * @returns {Promise<Object>} - Updated conversation
 */
async function resetConversationToStep(
  conversationId,
  step = "step0",
  options = {},
) {
  try {
    const { clearVariables = false, reason = "manual_reset" } = options;

    const conversation = await Conversation.query().findById(conversationId);

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const updateData = {
      current_step: step,
      status: CONVERSATION_STATES.ACTIVE,
      updated_at: new Date().toISOString(),
    };

    // Optionally clear captured variables
    if (clearVariables) {
      const existingMetadata = conversation.metadata || {};
      updateData.metadata = {
        ...existingMetadata,
        captured_variables: {},
        reset_at: new Date().toISOString(),
        reset_reason: reason,
      };
    }

    const updatedConversation = await Conversation.query().patchAndFetchById(
      conversationId,
      updateData,
    );

    logger.info(`Reset conversation ${conversationId} to step ${step}`, {
      reason,
      clearVariables,
    });

    return updatedConversation;
  } catch (error) {
    logger.error(`Error resetting conversation: ${error.message}`, error);
    throw error;
  }
}

/**
 * Get agent flow definition with step details
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} - Complete flow definition
 */
async function getAgentFlowDefinition(agentId) {
  try {
    const agent = await Agent.query()
      .findById(agentId)
      .withGraphFetched("nodes")
      .modifyGraph("nodes", (builder) => {
        builder.orderBy("step");
      });

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const flowDefinition = {
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        status: agent.status,
      },
      steps: {},
      flowMap: {},
      totalSteps: agent.nodes?.length || 0,
    };

    // Process each step
    if (agent.nodes) {
      agent.nodes.forEach((node) => {
        flowDefinition.steps[node.step] = {
          id: node.id,
          step: node.step,
          stepName: node.step_name,
          type: node.type_of_message,
          content: node.message_content,
          validation: {
            regex: node.regex,
            mandatory: node.mandatory,
            variable: node.variable,
          },
          nextSteps: node.next_possible_steps || [],
          purpose: node.purpose,
          aiEnabled: node.enable_ai_takeover,
        };

        // Build flow map for visualization
        if (node.next_possible_steps) {
          flowDefinition.flowMap[node.step] = node.next_possible_steps;
        }
      });
    }

    return flowDefinition;
  } catch (error) {
    logger.error(
      `Error getting agent flow definition: ${error.message}`,
      error,
    );
    throw error;
  }
}

/**
 * Validate agent flow configuration
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} - Validation results
 */
async function validateAgentFlow(agentId) {
  try {
    const flowDefinition = await getAgentFlowDefinition(agentId);
    const issues = [];
    const warnings = [];

    const steps = flowDefinition.steps;
    const stepKeys = Object.keys(steps); // Check for required starting step
    if (!steps["step0"]) {
      issues.push("Missing required starting step: step0");
    }

    // Check each step
    for (const [stepKey, step] of Object.entries(steps)) {
      // Validate step content
      if (!step.content || (!step.content.text && !step.content.content)) {
        issues.push(`Step ${stepKey}: Missing message content`);
      }

      // Validate next steps exist
      if (step.nextSteps && step.nextSteps.length > 0) {
        step.nextSteps.forEach((nextStep) => {
          if (nextStep !== "stop" && !steps[nextStep]) {
            issues.push(
              `Step ${stepKey}: References non-existent step '${nextStep}'`,
            );
          }
        });
      } else if (stepKey !== "step0") {
        warnings.push(
          `Step ${stepKey}: No next steps defined (this will end the flow)`,
        );
      }

      // Validate regex patterns
      if (step.validation.regex) {
        try {
          new RegExp(step.validation.regex);
        } catch (regexError) {
          issues.push(
            `Step ${stepKey}: Invalid regex pattern '${step.validation.regex}'`,
          );
        }
      }

      // Validate interactive message options
      if (step.type === "quick_reply" || step.type === "list") {
        const options =
          step.content.options || step.content.items?.[0]?.options || [];
        if (!options || options.length === 0) {
          issues.push(`Step ${stepKey}: Interactive message missing options`);
        } else {
          options.forEach((option, index) => {
            if (!option.title) {
              issues.push(`Step ${stepKey}: Option ${index} missing title`);
            }
            if (!option.postbackText) {
              warnings.push(
                `Step ${stepKey}: Option ${index} missing postbackText`,
              );
            }
          });
        }
      }
    } // Check for unreachable steps
    const reachableSteps = new Set(["step0"]);
    const toProcess = ["step0"];

    while (toProcess.length > 0) {
      const currentStep = toProcess.pop();
      const step = steps[currentStep];

      if (step && step.nextSteps) {
        step.nextSteps.forEach((nextStep) => {
          if (nextStep !== "stop" && !reachableSteps.has(nextStep)) {
            reachableSteps.add(nextStep);
            toProcess.push(nextStep);
          }
        });
      }
    }

    const unreachableSteps = stepKeys.filter(
      (step) => !reachableSteps.has(step),
    );
    unreachableSteps.forEach((step) => {
      warnings.push(`Step ${step} is not reachable from the flow`);
    });

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      totalSteps: stepKeys.length,
      reachableSteps: reachableSteps.size,
      flowHealth: {
        hasStartStep: !!steps["step0"],
        hasEndSteps: stepKeys.some(
          (key) => !steps[key].nextSteps || steps[key].nextSteps.length === 0,
        ),
        allStepsReachable: unreachableSteps.length === 0,
        validationScore: Math.max(
          0,
          100 - issues.length * 20 - warnings.length * 5,
        ),
      },
    };
  } catch (error) {
    logger.error(`Error validating agent flow: ${error.message}`, error);
    throw error;
  }
}

/**
 * Get conversation performance metrics for a time period
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Performance metrics
 */
async function getConversationPerformanceMetrics(options = {}) {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date(),
      agentId,
      businessChannelId,
    } = options;

    // Get analytics data
    const analytics = await generateConversationAnalytics({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      agentId,
      businessChannelId,
    });

    // Calculate additional performance metrics
    const performanceMetrics = {
      ...analytics,

      // Time-based metrics
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000)),
      },

      // Daily averages
      dailyAverages: {
        conversations:
          analytics.total_conversations /
          Math.max(1, Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000))),
        completions:
          analytics.completed_conversations /
          Math.max(1, Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000))),
      },

      // Health indicators
      healthIndicators: {
        completionRate: analytics.completion_rate,
        abandonmentRate:
          analytics.total_conversations > 0
            ? (analytics.abandoned_conversations /
                analytics.total_conversations) *
              100
            : 0,
        averageSteps: analytics.average_steps_per_conversation,
        validationSuccessRate:
          analytics.validation_analytics?.validation_success_rate || 0,
      },

      // Recommendations
      recommendations: generateRecommendations(analytics),
    };

    return performanceMetrics;
  } catch (error) {
    logger.error(`Error getting performance metrics: ${error.message}`, error);
    throw error;
  }
}

/**
 * Generate improvement recommendations based on analytics
 * @param {Object} analytics - Analytics data
 * @returns {Array} - Array of recommendations
 */
function generateRecommendations(analytics) {
  const recommendations = [];

  // Low completion rate
  if (analytics.completion_rate < 70) {
    recommendations.push({
      type: "completion_rate",
      priority: "high",
      title: "Low Completion Rate",
      description: `Only ${analytics.completion_rate.toFixed(
        1,
      )}% of conversations are being completed.`,
      suggestions: [
        "Review steps where users commonly drop off",
        "Simplify validation requirements",
        "Reduce the number of steps in your flow",
        "Improve error messages and guidance",
      ],
    });
  }

  // High validation failure rate
  if (analytics.validation_analytics?.validation_success_rate < 80) {
    recommendations.push({
      type: "validation",
      priority: "medium",
      title: "High Validation Failure Rate",
      description: "Users are frequently failing validation checks.",
      suggestions: [
        "Review regex patterns for user-friendliness",
        "Provide clearer input examples",
        "Add help text for complex validation requirements",
        "Consider making some fields optional",
      ],
    });
  }

  // Too many steps
  if (analytics.average_steps_per_conversation > 8) {
    recommendations.push({
      type: "flow_length",
      priority: "medium",
      title: "Long Conversation Flow",
      description: `Average of ${analytics.average_steps_per_conversation.toFixed(
        1,
      )} steps per conversation may be too long.`,
      suggestions: [
        "Consider breaking long flows into multiple shorter ones",
        "Remove unnecessary steps",
        "Combine related questions",
        "Use conditional logic to skip irrelevant steps",
      ],
    });
  }

  // Low agent performance
  Object.entries(analytics.agent_performance || {}).forEach(
    ([agentId, performance]) => {
      if (performance.completion_rate < 60) {
        recommendations.push({
          type: "agent_performance",
          priority: "high",
          title: `Poor Performance: ${performance.agent_name}`,
          description: `Agent has only ${performance.completion_rate.toFixed(
            1,
          )}% completion rate.`,
          suggestions: [
            "Review and optimize agent flow design",
            "Check for confusing or problematic steps",
            "Update validation patterns",
            "Consider user feedback and common failure points",
          ],
        });
      }
    },
  );

  return recommendations;
}

/**
 * Export conversation data for analysis
 * @param {Object} filters - Export filters
 * @returns {Promise<Array>} - Conversation data array
 */
async function exportConversationData(filters = {}) {
  try {
    const {
      startDate,
      endDate,
      agentId,
      businessChannelId,
      status,
      includeAnalytics = true,
    } = filters;

    let query = Conversation.query().withGraphFetched(
      "[endUser, agent, businessChannel]",
    );

    // Apply filters
    if (startDate) query = query.where("created_at", ">=", startDate);
    if (endDate) query = query.where("created_at", "<=", endDate);
    if (agentId) query = query.where("agent_id", agentId);
    if (businessChannelId)
      query = query.where("business_channel_id", businessChannelId);
    if (status) query = query.where("status", status);

    const conversations = await query;

    return conversations.map((conv) => {
      const baseData = {
        conversation_id: conv.id,
        status: conv.status,
        current_step: conv.current_step,
        created_at: conv.created_at,
        updated_at: conv.updated_at,

        user_phone: conv.endUser?.phone,
        user_name: conv.endUser?.name,

        agent_id: conv.agent?.id,
        agent_name: conv.agent?.name,

        channel_id: conv.businessChannel?.id,
        channel_name: conv.businessChannel?.name,

        captured_variables: conv.metadata?.captured_variables || {},
      };

      if (includeAnalytics && conv.metadata?.analytics) {
        const analytics = conv.metadata.analytics;
        baseData.analytics = {
          total_events: analytics.events?.length || 0,
          completion_rate: analytics.completion_rate || 0,
          average_response_time: analytics.average_response_time || 0,
          step_counts: analytics.step_counts || {},
        };
      }

      return baseData;
    });
  } catch (error) {
    logger.error(`Error exporting conversation data: ${error.message}`, error);
    throw error;
  }
}

module.exports = {
  getConversationSummary,
  resetConversationToStep,
  getAgentFlowDefinition,
  validateAgentFlow,
  getConversationPerformanceMetrics,
  generateRecommendations,
  exportConversationData,
};
