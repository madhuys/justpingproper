// AgentsFlow/strictAgentValidator.js
const logger = require("../system/utils/logger");
const Broadcast = require("../system/models/Broadcast");
const Agent = require("../system/models/Agent");

/**
 * Strict Agent Validator for Broadcast-based Conversations
 * This module enforces that outbound broadcast conversations can only use agents
 * that are specifically mapped in the broadcast's agent_mapping data.
 */

/**
 * Helper function to determine valid agent statuses
 * Agents with these statuses are considered usable for conversations
 * @returns {Array<string>} - Array of valid agent statuses
 */
function getValidAgentStatuses() {
  return ["active", "approved"]; // Both 'active' and 'approved' agents can be used
}

/**
 * Helper function to check if an agent status is valid for use
 * @param {string} status - Agent status to check
 * @returns {boolean} - Whether the status is valid for use
 */
function isValidAgentStatus(status) {
  return getValidAgentStatuses().includes(status);
}

/**
 * Helper function to get system agent status overview
 * @returns {Promise<Object>} - System agent status information
 */
async function getSystemAgentStatus() {
  try {
    const allAgents = await Agent.query().select(
      "id",
      "name",
      "description",
      "status",
    );

    const statusCounts = allAgents.reduce((acc, agent) => {
      acc[agent.status] = (acc[agent.status] || 0) + 1;
      return acc;
    }, {});

    const validStatuses = getValidAgentStatuses();

    return {
      totalAgents: allAgents.length,
      statusCounts,
      agents: allAgents,
      hasActiveAgents: allAgents.some((a) => isValidAgentStatus(a.status)),
      validStatuses,
      usableAgents: allAgents.filter((a) => isValidAgentStatus(a.status)),
    };
  } catch (error) {
    logger.error("Error getting system agent status:", error);
    return {
      totalAgents: 0,
      statusCounts: {},
      agents: [],
      hasActiveAgents: false,
      validStatuses: getValidAgentStatuses(),
      usableAgents: [],
      error: error.message,
    };
  }
}

/**
 * Validate if an agent can be used for a specific broadcast conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} agentId - Agent ID to validate
 * @param {string} broadcastId - Broadcast ID (optional, will be extracted from conversation)
 * @returns {Promise<Object>} - Validation result
 */
async function validateAgentForBroadcast(
  conversationId,
  agentId,
  broadcastId = null,
) {
  try {
    logger.info("Validating agent for broadcast conversation:", {
      conversationId,
      agentId,
      providedBroadcastId: broadcastId,
    });

    // Get broadcast ID if not provided
    if (!broadcastId) {
      const Conversation = require("../system/models/Conversation");
      const conversation = await Conversation.query()
        .select("id", "metadata", "broadcast_id")
        .where("id", conversationId)
        .first();

      if (!conversation) {
        return {
          isValid: false,
          error: "Conversation not found",
          code: "CONVERSATION_NOT_FOUND",
        };
      }

      broadcastId =
        conversation.broadcast_id || conversation.metadata?.broadcast_id;
    }

    if (!broadcastId) {
      return {
        isValid: false,
        error: "No broadcast_id found in conversation data",
        code: "NO_BROADCAST_ID",
      };
    }

    // Get broadcast details
    const broadcast = await Broadcast.query()
      .select("id", "name", "agent_mapping", "metadata", "type")
      .where("id", broadcastId)
      .first();

    if (!broadcast) {
      return {
        isValid: false,
        error: "Broadcast not found",
        code: "BROADCAST_NOT_FOUND",
      };
    }

    const agentMapping = broadcast.agent_mapping || {};
    const broadcastType = broadcast.type;

    logger.info("Broadcast details retrieved:", {
      broadcastId,
      broadcastType,
      agentMappingKeys: Object.keys(agentMapping),
    });

    // Apply strict validation for outbound broadcasts
    if (broadcastType === "outbound") {
      const mappedAgentIds = Object.values(agentMapping);
      const isAgentInMapping = mappedAgentIds.includes(agentId);

      if (!isAgentInMapping) {
        logger.warn("Agent rejected - not in outbound broadcast mapping:", {
          agentId,
          broadcastType,
          availableAgentIds: mappedAgentIds,
        });

        return {
          isValid: false,
          error: "Agent not available for this outbound broadcast",
          code: "AGENT_NOT_IN_MAPPING",
          details: {
            broadcastType,
            requestedAgentId: agentId,
            availableAgentIds: mappedAgentIds,
            validationMode: "strict_broadcast_mapping",
          },
        };
      }

      // Agent is in mapping, verify it exists and has valid status
      const agent = await Agent.query()
        .select("id", "name", "description", "status")
        .where("id", agentId)
        .whereIn("status", getValidAgentStatuses())
        .first();

      if (!agent) {
        logger.warn("Agent in mapping but not found or inactive:", {
          agentId,
          broadcastType,
        });

        return {
          isValid: false,
          error:
            "Agent exists in broadcast mapping but is not active or not found",
          code: "AGENT_INACTIVE_OR_NOT_FOUND",
          details: {
            broadcastType,
            requestedAgentId: agentId,
            validationMode: "strict_broadcast_mapping",
          },
        };
      }

      // Find keywords that map to this agent
      const agentKeywords = Object.entries(agentMapping)
        .filter(([keyword, mappedAgentId]) => mappedAgentId === agentId)
        .map(([keyword]) => keyword);

      logger.info("Agent validation successful (strict mode):", {
        agentId,
        agentName: agent.name,
        keywords: agentKeywords,
        broadcastType,
      });

      return {
        isValid: true,
        agent,
        broadcast: {
          id: broadcast.id,
          name: broadcast.name,
          type: broadcast.type,
        },
        mappingDetails: {
          keywords: agentKeywords,
          broadcastType,
          validationMode: "strict_broadcast_mapping",
        },
      };
    } else {
      // For non-outbound broadcasts, use regular agent lookup
      const agent = await Agent.query()
        .select("id", "name", "description", "status")
        .where("id", agentId)
        .whereIn("status", getValidAgentStatuses())
        .first();

      if (!agent) {
        return {
          isValid: false,
          error: "Agent not found or inactive",
          code: "AGENT_NOT_FOUND",
          details: {
            broadcastType,
            requestedAgentId: agentId,
            validationMode: "regular_agent_lookup",
          },
        };
      }

      // Check if agent is also in broadcast mapping (informational)
      const mappedAgentIds = Object.values(agentMapping);
      const isInBroadcastMapping = mappedAgentIds.includes(agentId);
      const agentKeywords = isInBroadcastMapping
        ? Object.entries(agentMapping)
            .filter(([keyword, mappedAgentId]) => mappedAgentId === agentId)
            .map(([keyword]) => keyword)
        : [];

      logger.info("Agent validation successful (regular mode):", {
        agentId,
        agentName: agent.name,
        isInBroadcastMapping,
        broadcastType,
      });

      return {
        isValid: true,
        agent,
        broadcast: {
          id: broadcast.id,
          name: broadcast.name,
          type: broadcast.type,
        },
        mappingDetails: {
          keywords: agentKeywords,
          isInBroadcastMapping,
          broadcastType,
          validationMode: "regular_agent_lookup",
        },
      };
    }
  } catch (error) {
    logger.error("Error validating agent for broadcast:", error);
    return {
      isValid: false,
      error: "Internal validation error",
      code: "INTERNAL_ERROR",
      details: {
        originalError: error.message,
      },
    };
  }
}

/**
 * Get all valid agents for a broadcast conversation
 * @param {string} broadcastId - Broadcast ID
 * @returns {Promise<Object>} - List of valid agents
 */
async function getValidAgentsForBroadcast(broadcastId) {
  try {
    logger.info("Getting valid agents for broadcast:", { broadcastId });

    const broadcast = await Broadcast.query()
      .select("id", "name", "agent_mapping", "metadata", "type")
      .where("id", broadcastId)
      .first();

    if (!broadcast) {
      return {
        success: false,
        error: "Broadcast not found",
        code: "BROADCAST_NOT_FOUND",
      };
    }

    const agentMapping = broadcast.agent_mapping || {};
    const broadcastType = broadcast.type;

    if (broadcastType === "outbound") {
      // For outbound broadcasts, only return agents from mapping
      const mappedAgentIds = [...new Set(Object.values(agentMapping))];

      if (mappedAgentIds.length === 0) {
        return {
          success: true,
          agents: [],
          broadcast: {
            id: broadcast.id,
            name: broadcast.name,
            type: broadcast.type,
          },
          validationMode: "strict_broadcast_mapping",
          message: "No agents mapped for this outbound broadcast",
        };
      }
      const agents = await Agent.query()
        .select("id", "name", "description", "status")
        .whereIn("id", mappedAgentIds)
        .whereIn("status", getValidAgentStatuses());

      // Map agents with their keywords
      const agentsWithKeywords = agents.map((agent) => {
        const keywords = Object.entries(agentMapping)
          .filter(([keyword, agentId]) => agentId === agent.id)
          .map(([keyword]) => keyword);

        return {
          ...agent,
          keywords,
        };
      });

      return {
        success: true,
        agents: agentsWithKeywords,
        broadcast: {
          id: broadcast.id,
          name: broadcast.name,
          type: broadcast.type,
        },
        validationMode: "strict_broadcast_mapping",
        totalMappings: Object.keys(agentMapping).length,
        totalUniqueAgents: mappedAgentIds.length,
      };
    } else {
      // For non-outbound broadcasts, return all active agents
      const agents = await Agent.query()
        .select("id", "name", "description", "status")
        .whereIn("status", getValidAgentStatuses());

      // Mark which agents are also in broadcast mapping
      const mappedAgentIds = Object.values(agentMapping);
      const agentsWithMappingInfo = agents.map((agent) => {
        const isInMapping = mappedAgentIds.includes(agent.id);
        const keywords = isInMapping
          ? Object.entries(agentMapping)
              .filter(([keyword, agentId]) => agentId === agent.id)
              .map(([keyword]) => keyword)
          : [];

        return {
          ...agent,
          isInBroadcastMapping: isInMapping,
          keywords,
        };
      });

      return {
        success: true,
        agents: agentsWithMappingInfo,
        broadcast: {
          id: broadcast.id,
          name: broadcast.name,
          type: broadcast.type,
        },
        validationMode: "regular_agent_lookup",
        totalAgents: agents.length,
        totalInMapping: mappedAgentIds.length,
      };
    }
  } catch (error) {
    logger.error("Error getting valid agents for broadcast:", error);
    return {
      success: false,
      error: "Internal error getting agents",
      code: "INTERNAL_ERROR",
      details: {
        originalError: error.message,
      },
    };
  }
}

/**
 * Validate agent assignment for conversation (used in webhook flow)
 * @param {string} conversationId - Conversation ID
 * @param {string} agentId - Agent ID to assign
 * @returns {Promise<Object>} - Assignment validation result
 */
async function validateAgentAssignment(conversationId, agentId) {
  try {
    const validation = await validateAgentForBroadcast(conversationId, agentId);

    if (!validation.isValid) {
      logger.warn("Agent assignment rejected:", {
        conversationId,
        agentId,
        reason: validation.error,
        code: validation.code,
      });

      return {
        canAssign: false,
        error: validation.error,
        code: validation.code,
        details: validation.details,
      };
    }

    logger.info("Agent assignment validated:", {
      conversationId,
      agentId,
      agentName: validation.agent.name,
      validationMode: validation.mappingDetails.validationMode,
    });

    return {
      canAssign: true,
      agent: validation.agent,
      broadcast: validation.broadcast,
      mappingDetails: validation.mappingDetails,
    };
  } catch (error) {
    logger.error("Error validating agent assignment:", error);
    return {
      canAssign: false,
      error: "Internal assignment validation error",
      code: "INTERNAL_ERROR",
    };
  }
}

/**
 * Find agent with keyword fallback logic for broadcast conversations
 * Implements fallback where if keywords don't match user input, defaults to first keyword's agent
 * @param {string} conversationId - Conversation ID
 * @param {string} userInput - User's message text
 * @param {string} broadcastId - Broadcast ID (optional, will be extracted from conversation)
 * @returns {Promise<Object>} - Agent finding result with fallback
 */
async function findAgentWithKeywordFallback(
  conversationId,
  userInput,
  broadcastId = null,
) {
  try {
    logger.info("Finding agent with keyword fallback:", {
      conversationId,
      userInput,
      providedBroadcastId: broadcastId,
    }); // Get broadcast ID if not provided
    if (!broadcastId) {
      const Conversation = require("../system/models/Conversation");
      const conversation = await Conversation.query()
        .select("id", "metadata", "broadcast_id")
        .where("id", conversationId)
        .first();

      if (!conversation) {
        return {
          success: false,
          error: "Conversation not found",
          code: "CONVERSATION_NOT_FOUND",
        };
      }

      broadcastId =
        conversation.broadcast_id || conversation.metadata?.broadcast_id;
    }

    if (!broadcastId) {
      return {
        success: false,
        error: "No broadcast_id found in conversation data",
        code: "NO_BROADCAST_ID",
      };
    }

    // Get broadcast details
    const broadcast = await Broadcast.query()
      .select("id", "name", "agent_mapping", "metadata", "type")
      .where("id", broadcastId)
      .first();

    if (!broadcast) {
      return {
        success: false,
        error: "Broadcast not found",
        code: "BROADCAST_NOT_FOUND",
      };
    }

    const agentMapping = broadcast.agent_mapping || {};
    const broadcastType = broadcast.type;

    logger.info("Broadcast details for keyword fallback:", {
      broadcastId,
      broadcastType,
      agentMappingKeys: Object.keys(agentMapping),
      userInput,
    });

    if (Object.keys(agentMapping).length === 0) {
      return {
        success: false,
        error: "No agent mapping available in broadcast",
        code: "NO_AGENT_MAPPING",
        details: {
          broadcastType,
          broadcastId,
        },
      };
    }

    // Step 1: Try to find exact keyword match
    const normalizedInput = userInput.toLowerCase().trim();
    let matchedKeyword = null;
    let matchedAgentId = null;

    // Check for exact match first
    for (const [keyword, agentId] of Object.entries(agentMapping)) {
      if (normalizedInput === keyword.toLowerCase()) {
        matchedKeyword = keyword;
        matchedAgentId = agentId;
        logger.info("Found exact keyword match:", {
          keyword,
          agentId,
          userInput: normalizedInput,
        });
        break;
      }
    }

    // Step 2: Try partial keyword match if no exact match
    if (!matchedAgentId) {
      for (const [keyword, agentId] of Object.entries(agentMapping)) {
        if (
          normalizedInput.includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(normalizedInput)
        ) {
          matchedKeyword = keyword;
          matchedAgentId = agentId;
          logger.info("Found partial keyword match:", {
            keyword,
            agentId,
            userInput: normalizedInput,
          });
          break;
        }
      }
    }

    // Step 3: Fallback to first keyword's agent if no match found
    if (!matchedAgentId) {
      const firstKeyword = Object.keys(agentMapping)[0];
      const firstAgentId = agentMapping[firstKeyword];

      logger.info("No keyword match found, falling back to first keyword:", {
        fallbackKeyword: firstKeyword,
        fallbackAgentId: firstAgentId,
        userInput: normalizedInput,
        availableKeywords: Object.keys(agentMapping),
      });

      matchedKeyword = firstKeyword;
      matchedAgentId = firstAgentId;
    } // Step 4: Validate the matched agent
    let agent = await Agent.query()
      .select("id", "name", "description", "status")
      .where("id", matchedAgentId)
      .whereIn("status", getValidAgentStatuses())
      .first();

    if (!agent) {
      logger.warn("Matched agent not found or inactive:", {
        matchedAgentId,
        matchedKeyword,
        broadcastType,
      }); // If the matched agent is inactive, try to find the first available active agent
      // from all agents in the keyword mapping (as a default agent)
      logger.info(
        "Attempting to find default active agent from keyword mapping:",
        {
          availableKeywords: Object.keys(agentMapping),
          attemptingFallbackToDefault: true,
          inactiveAgentId: matchedAgentId,
        },
      );

      const allMappedAgentIds = Object.values(agentMapping);
      const uniqueAgentIds = [...new Set(allMappedAgentIds)]; // Remove duplicates

      // First, let's check what agents exist (active or inactive) in the mapping
      const allMappedAgents = await Agent.query()
        .select("id", "name", "description", "status")
        .whereIn("id", uniqueAgentIds);
      logger.info("All agents in broadcast mapping (regardless of status):", {
        mappedAgents: allMappedAgents.map((a) => ({
          id: a.id,
          name: a.name,
          status: a.status,
        })),
        totalMapped: allMappedAgents.length,
        activeCount: allMappedAgents.filter((a) => isValidAgentStatus(a.status))
          .length,
      });

      // Try to find the first active agent from the mapping
      const defaultAgent = await Agent.query()
        .select("id", "name", "description", "status")
        .whereIn("id", uniqueAgentIds)
        .whereIn("status", getValidAgentStatuses())
        .first();

      if (!defaultAgent) {
        logger.warn(
          "No active agents found in broadcast mapping, trying any active agent:",
          {
            broadcastId,
            agentMapping,
            uniqueAgentIds,
            inactiveMappedAgents: allMappedAgents
              .filter((a) => !isValidAgentStatus(a.status))
              .map((a) => ({
                id: a.id,
                name: a.name,
                status: a.status,
              })),
          },
        ); // Final fallback: Find ANY active agent in the system
        const anyActiveAgent = await Agent.query()
          .select("id", "name", "description", "status")
          .whereIn("status", getValidAgentStatuses())
          .first();

        // Also check total agent count for debugging
        const totalAgentCount = await Agent.query()
          .count("id as count")
          .first();
        const activeAgentCount = await Agent.query()
          .whereIn("status", getValidAgentStatuses())
          .count("id as count")
          .first();

        logger.info("System-wide agent status check:", {
          totalAgents: totalAgentCount.count,
          activeAgents: activeAgentCount.count,
          foundSystemWideActive: !!anyActiveAgent,
        });
        if (!anyActiveAgent) {
          // Get all agents in system for debugging
          const allSystemAgents = await Agent.query().select(
            "id",
            "name",
            "description",
            "status",
          );

          logger.error("No active agents found in entire system:", {
            broadcastId,
            agentMapping,
            uniqueAgentIds,
            totalSystemAgents: allSystemAgents.length,
            systemAgentStatuses: allSystemAgents.reduce((acc, agent) => {
              acc[agent.status] = (acc[agent.status] || 0) + 1;
              return acc;
            }, {}),
            allSystemAgents: allSystemAgents.map((a) => ({
              id: a.id,
              name: a.name,
              status: a.status,
            })),
          });

          return {
            success: false,
            error: "No active agents available in entire system",
            code: "NO_ACTIVE_AGENTS_SYSTEM_WIDE",
            details: {
              broadcastType,
              originalMatchedAgentId: matchedAgentId,
              originalMatchedKeyword: matchedKeyword,
              availableAgentIds: uniqueAgentIds,
              allInactive: true,
              systemWideCheck: true,
              totalSystemAgents: allSystemAgents.length,
              systemAgentStatuses: allSystemAgents.reduce((acc, agent) => {
                acc[agent.status] = (acc[agent.status] || 0) + 1;
                return acc;
              }, {}),
              suggestion:
                allSystemAgents.length > 0
                  ? `Consider activating one of the existing agents by setting their status to one of: ${getValidAgentStatuses().join(
                      ", ",
                    )}`
                  : "No agents exist in the system. Create and activate at least one agent.",
            },
          };
        }

        // Use the system-wide active agent as final fallback
        logger.info("Using system-wide active agent as final fallback:", {
          originalAgentId: matchedAgentId,
          originalKeyword: matchedKeyword,
          systemAgentId: anyActiveAgent.id,
          systemAgentName: anyActiveAgent.name,
          fallbackType: "system_wide_active_agent",
        }); // Update the matched values to use the system agent
        matchedAgentId = anyActiveAgent.id;
        matchedKeyword = Object.keys(agentMapping)[0]; // Use first keyword as placeholder

        // Continue with the system agent
        agent = anyActiveAgent;
      } else {
        // Find which keyword maps to this default agent
        const defaultKeyword = Object.entries(agentMapping).find(
          ([keyword, agentId]) => agentId === defaultAgent.id,
        )?.[0];

        logger.info("Found default active agent:", {
          originalAgentId: matchedAgentId,
          originalKeyword: matchedKeyword,
          defaultAgentId: defaultAgent.id,
          defaultAgentName: defaultAgent.name,
          defaultKeyword,
          fallbackType: "default_active_agent",
        });

        // Update the matched values to use the default agent
        matchedAgentId = defaultAgent.id;
        matchedKeyword = defaultKeyword;

        // Continue with the default agent
        agent = defaultAgent;
      }
    }

    // Step 5: Determine match type for logging and response
    const isExactMatch = normalizedInput === matchedKeyword.toLowerCase();
    const isPartialMatch =
      !isExactMatch &&
      (normalizedInput.includes(matchedKeyword.toLowerCase()) ||
        matchedKeyword.toLowerCase().includes(normalizedInput));
    const isFallback = !isExactMatch && !isPartialMatch;

    logger.info("Agent found with keyword fallback logic:", {
      agentId: agent.id,
      agentName: agent.name,
      matchedKeyword,
      userInput: normalizedInput,
      matchType: isExactMatch
        ? "exact"
        : isPartialMatch
        ? "partial"
        : "fallback",
      broadcastType,
    });

    return {
      success: true,
      agent,
      broadcast: {
        id: broadcast.id,
        name: broadcast.name,
        type: broadcast.type,
      },
      matchDetails: {
        keyword: matchedKeyword,
        userInput: normalizedInput,
        matchType: isExactMatch
          ? "exact"
          : isPartialMatch
          ? "partial"
          : "fallback",
        isExactMatch,
        isPartialMatch,
        isFallback,
        allAvailableKeywords: Object.keys(agentMapping),
        broadcastType,
        validationMode: "keyword_fallback_matching",
      },
    };
  } catch (error) {
    logger.error("Error in keyword fallback agent finding:", error);
    return {
      success: false,
      error: "Internal error in keyword fallback logic",
      code: "INTERNAL_ERROR",
      details: {
        originalError: error.message,
      },
    };
  }
}

/**
 * Find or assign agent with conversation persistence
 * For first-time users, find agent using keyword fallback and store in conversation
 * For returning users, use the agent already assigned to the conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userInput - User's message text
 * @param {string} broadcastId - Broadcast ID (optional, will be extracted from conversation)
 * @returns {Promise<Object>} - Agent finding result with persistence
 */
async function findOrAssignAgentWithPersistence(
  conversationId,
  userInput,
  broadcastId = null,
) {
  try {
    logger.info("Finding or assigning agent with conversation persistence:", {
      conversationId,
      userInput,
      providedBroadcastId: broadcastId,
    });

    // Get conversation details first
    const Conversation = require("../system/models/Conversation");
    const conversation = await Conversation.query()
      .select(
        "id",
        "agent_id",
        "metadata",
        "broadcast_id",
        "status",
        "current_step",
      )
      .where("id", conversationId)
      .first();

    if (!conversation) {
      return {
        success: false,
        error: "Conversation not found",
        code: "CONVERSATION_NOT_FOUND",
      };
    }

    // Check if conversation already has an assigned agent
    if (conversation.agent_id) {
      logger.info("Conversation already has assigned agent:", {
        conversationId,
        assignedAgentId: conversation.agent_id,
        conversationStatus: conversation.status,
      });

      // Validate that the assigned agent is still active and valid
      const existingAgent = await Agent.query()
        .select("id", "name", "description", "status")
        .where("id", conversation.agent_id)
        .whereIn("status", getValidAgentStatuses())
        .first();

      if (existingAgent) {
        logger.info("Using existing assigned agent:", {
          conversationId,
          agentId: existingAgent.id,
          agentName: existingAgent.name,
          agentStatus: existingAgent.status,
          persistenceType: "existing_assignment",
        });

        // Get broadcast details for response consistency
        const broadcastIdToUse =
          broadcastId ||
          conversation.broadcast_id ||
          conversation.metadata?.broadcast_id;
        let broadcast = null;
        if (broadcastIdToUse) {
          broadcast = await Broadcast.query()
            .select("id", "name", "type")
            .where("id", broadcastIdToUse)
            .first();
        }

        return {
          success: true,
          agent: existingAgent,
          broadcast: broadcast
            ? {
                id: broadcast.id,
                name: broadcast.name,
                type: broadcast.type,
              }
            : null,
          conversation: {
            id: conversation.id,
            status: conversation.status,
            currentStep: conversation.current_step,
          },
          persistenceDetails: {
            isExistingAssignment: true,
            wasAlreadyAssigned: true,
            persistenceType: "existing_assignment",
            validationMode: "agent_persistence",
          },
        };
      } else {
        logger.warn("Assigned agent is no longer valid, finding new agent:", {
          conversationId,
          invalidAgentId: conversation.agent_id,
          reason: "agent_not_found_or_inactive",
        });

        // Clear the invalid agent assignment
        await Conversation.query().patchAndFetchById(conversationId, {
          agent_id: null,
          metadata: {
            ...conversation.metadata,
            agent_reassignment_reason: "previous_agent_inactive",
            agent_reassignment_at: new Date().toISOString(),
          },
        });
      }
    }

    // No valid assigned agent, find and assign a new one using keyword fallback
    logger.info(
      "Finding new agent for conversation (first-time or reassignment):",
      {
        conversationId,
        userInput,
        isReassignment: !!conversation.agent_id,
      },
    );

    const keywordFallbackResult = await findAgentWithKeywordFallback(
      conversationId,
      userInput,
      broadcastId,
    );

    if (!keywordFallbackResult.success) {
      logger.warn("Failed to find agent using keyword fallback:", {
        conversationId,
        userInput,
        error: keywordFallbackResult.error,
        code: keywordFallbackResult.code,
      });

      return {
        success: false,
        error: keywordFallbackResult.error,
        code: keywordFallbackResult.code,
        details: {
          ...keywordFallbackResult.details,
          persistenceType: "new_assignment_failed",
        },
      };
    }

    // Found an agent, assign it to the conversation
    const foundAgent = keywordFallbackResult.agent;

    logger.info("Assigning new agent to conversation:", {
      conversationId,
      agentId: foundAgent.id,
      agentName: foundAgent.name,
      matchType: keywordFallbackResult.matchDetails.matchType,
      matchedKeyword: keywordFallbackResult.matchDetails.keyword,
    });

    // Update conversation with the assigned agent
    const updatedConversation = await Conversation.query().patchAndFetchById(
      conversationId,
      {
        agent_id: foundAgent.id,
        metadata: {
          ...conversation.metadata,
          agent_assigned_at: new Date().toISOString(),
          agent_assignment_method: "keyword_fallback",
          keyword_match_details: {
            matchType: keywordFallbackResult.matchDetails.matchType,
            matchedKeyword: keywordFallbackResult.matchDetails.keyword,
            userInput: keywordFallbackResult.matchDetails.userInput,
            isExactMatch: keywordFallbackResult.matchDetails.isExactMatch,
            isPartialMatch: keywordFallbackResult.matchDetails.isPartialMatch,
            isFallback: keywordFallbackResult.matchDetails.isFallback,
          },
        },
      },
    );

    logger.info("Successfully assigned agent to conversation:", {
      conversationId,
      agentId: foundAgent.id,
      agentName: foundAgent.name,
      persistenceType: "new_assignment",
    });

    return {
      success: true,
      agent: foundAgent,
      broadcast: keywordFallbackResult.broadcast,
      conversation: {
        id: updatedConversation.id,
        status: updatedConversation.status,
        currentStep: updatedConversation.current_step,
      },
      matchDetails: keywordFallbackResult.matchDetails,
      persistenceDetails: {
        isExistingAssignment: false,
        wasNewlyAssigned: true,
        persistenceType: "new_assignment",
        assignmentMethod: "keyword_fallback",
        assignedAt: new Date().toISOString(),
        validationMode: "agent_persistence_with_keyword_fallback",
      },
    };
  } catch (error) {
    logger.error("Error in agent persistence logic:", error);
    return {
      success: false,
      error: "Internal error in agent persistence logic",
      code: "INTERNAL_ERROR",
      details: {
        originalError: error.message,
        persistenceType: "error",
      },
    };
  }
}

module.exports = {
  validateAgentForBroadcast,
  getValidAgentsForBroadcast,
  validateAgentAssignment,
  findAgentWithKeywordFallback,
  getSystemAgentStatus,
  findOrAssignAgentWithPersistence,
};
