// api/Agents/service.js
const boom = require("@hapi/boom");
const logger = require("../../system/utils/logger");
const { transaction } = require("../../system/db/database");
const Agent = require("../../system/models/Agent");
const AgentNode = require("../../system/models/AgentNode");
const AIConfig = require("../../system/models/AIConfig");
const Business = require("../../system/models/Business");
const BusinessUser = require("../../system/models/BusinessUser");

const { exportFlow } = require("./middleware");
const { isEmptyArray } = require("../../system/utils/checks");

/**
 * Get all agents with filtering and pagination
 * @param {Object} filters - Query filters
 * @param {Object} pagination - Pagination parameters
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Agents and pagination info
 */
async function getAllAgents(filters = {}, pagination = {}, businessId) {
  try {
    // Validate business exists
    const business = await Business.query().findById(businessId);
    if (!business) {
      throw boom.notFound("Business not found");
    }

    // Add business_id to filters
    filters.business_id = businessId;

    // Get all agents with pagination and filtering
    const result = await Agent.findByBusinessId(
      businessId,
      filters,
      pagination,
    );

    return result;
  } catch (error) {
    logger.error("Error getting agents:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to fetch agents");
  }
}

/**
 * Get agent by ID
 * @param {string} id - Agent ID
 * @param {string} businessId - Business ID
 * @param {Object} options - Additional options like includeDefinition
 * @returns {Promise<Object>} - Agent data
 */
async function getAgentById(id, businessId, options = {}) {
  try {
    const query = Agent.query()
      .modify("notDeleted")
      .where({ id, business_id: businessId });

    // Include relations based on options
    if (options.includeDefinition) {
      query.select("*");
    } else {
      // If not including definition, exclude large fields
      query.select([
        "id",
        "business_id",
        "name",
        "description",
        "key_words",
        "variables",
        "status",
        "is_active",
        "is_deleted",
        "version",
        "created_by",
        "created_at",
        "updated_at",
        "approved_by",
        "approved_at",
        "metadata",
      ]);
    }

    const agent = await query.first();

    if (!agent) {
      throw boom.notFound("Agent not found");
    }

    return agent;
  } catch (error) {
    logger.error(`Error getting agent by ID ${id}:`, error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to fetch agent");
  }
}

/**
 * Get multiple agents by their IDs
 * @param {Array<string>} ids - Array of Agent IDs
 * @param {string} businessId - Business ID
 * @param {Object} options - Additional options like includeDefinition
 * @returns {Promise<Array>} - Array of agent data
 */
async function getAgentsByIds(ids, businessId, options = {}) {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      return [];
    }

    const query = Agent.query()
      .modify("notDeleted")
      .whereIn("id", ids)
      .where({ business_id: businessId });

    // Include relations based on options
    if (options.includeDefinition) {
      query.select("*");
    } else {
      // If not including definition, exclude large fields
      query.select([
        "id",
        "business_id",
        "name",
        "description",
        "key_words",
        "variables",
        "status",
        "is_active",
        "is_deleted",
        "version",
        "created_by",
        "created_at",
        "updated_at",
        "approved_by",
        "approved_at",
        "metadata",
      ]);
    }

    const agents = await query;

    return agents;
  } catch (error) {
    logger.error(`Error getting agents by IDs ${ids.join(", ")}:`, error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to fetch agents");
  }
}

/**
 * Create a new agent
 * @param {Object} data - Agent data
 * @param {string} businessId - Business ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Created agent
 */
async function createAgent(data, businessId, userId) {
  return await transaction(async (trx) => {
    try {
      // Check if business exists
      const business = await Business.query(trx).findById(businessId);
      if (!business) {
        throw boom.notFound("Business not found");
      }

      // Check if user exists
      const user = await BusinessUser.query(trx).findById(userId);
      if (!user) {
        throw boom.notFound("User not found");
      }

      // Check if agent with same name already exists
      const existingAgent = await Agent.query(trx)
        .where({
          business_id: businessId,
          name: data.name,
        })
        .modify("notDeleted")
        .first();

      if (existingAgent) {
        throw boom.conflict("Agent with this name already exists");
      }

      // Prepare agent data
      const agentData = {
        business_id: businessId,
        name: data.name,
        description: data.description || null,
        key_words: data.key_words || [],
        created_by: userId,
        ai_character: data.ai_character || null,
        global_rules: data.global_rules || null,
        agent_definition: data.agent_definition || {
          nodes: [],
          connections: [],
        },
        metadata: data.metadata || {},
        variables: data.variables || [],
      };

      // Create agent
      const agent = await Agent.query(trx).insert(agentData); // Check if we have nodes definition
      if (
        data?.agent_definition?.nodes &&
        Array.isArray(data.agent_definition.nodes) &&
        !isEmptyArray(data.agent_definition.nodes) &&
        data?.agent_definition?.connections &&
        Array.isArray(data.agent_definition.connections) &&
        !isEmptyArray(data.agent_definition.connections)
      ) {
        const agent_definition = await exportFlow(data?.agent_definition);

        // Create node records and related AI configs
        if (Array.isArray(agent_definition) && agent_definition.length > 0) {
          // Process nodes and create them with their AI configs
          await Promise.all(
            agent_definition?.map(async (nodeData) => {
              // Extract AI config if it exists
              const aiConfigData = nodeData.ai_config || {};
              delete nodeData.ai_config;

              // Prepare node data
              const agentNode = {
                agent_id: agent.id,
              };

              // Create the node first
              const createdNode = await AgentNode.query(trx).insert(agentNode);

              // If AI config exists, create it and link it to the node
              if (Object.keys(aiConfigData).length > 0) {
                const aiConfig = await AIConfig.query(trx).insert({
                  node_id: createdNode.id,
                  system_prompt: aiConfigData.system_prompt || null,
                  ai_provider: aiConfigData.ai_provider || "gpt",
                  model: aiConfigData.model || "gpt-4o",
                  max_tokens: aiConfigData.max_tokens || 1024,
                  temperature: aiConfigData.temperature || 0.7,
                  context_input: aiConfigData.context_input || null,
                });

                // Update the node with the AI config reference
                await AgentNode.query(trx).findById(createdNode.id).patch({
                  ai_config_id: aiConfig.id,
                });
              }
            }),
          );
          logger.info(
            `Created ${agent_definition.length} nodes for agent ${agent.id}`,
          );
        }
      }

      return agent;
    } catch (error) {
      logger.error("Error creating agent:", error);
      if (error.isBoom) {
        throw error;
      }
      if (error.code === "23505") {
        throw boom.conflict("Agent with this name already exists");
      }
      throw boom.badImplementation("Failed to create agent");
    }
  });
}

/**
 * Update an existing agent
 * @param {string} id - Agent ID
 * @param {Object} data - Updated agent data
 * @param {string} businessId - Business ID
 * @param {boolean} createVersion - Whether to create a new version
 * @returns {Promise<Object>} - Updated agent
 */
async function updateAgent(id, data, businessId, createVersion = false) {
  return await transaction(async (trx) => {
    try {
      // Get the existing agent
      const agent = await Agent.query(trx)
        .where({
          id,
          business_id: businessId,
        })
        .modify("notDeleted")
        .first();

      if (!agent) {
        throw boom.notFound("Agent not found");
      }

      // Cannot update approved agents without creating a new version
      if (agent.status === "approved" && !createVersion) {
        throw boom.forbidden(
          "Cannot update an approved agent. Set create_version=true to create a new version.",
        );
      }

      // Check if name is changed and conflicts with existing agents
      if (data.name && data.name !== agent.name) {
        const existingAgent = await Agent.query(trx)
          .where({
            business_id: businessId,
            name: data.name,
          })
          .whereNot({ id })
          .modify("notDeleted")
          .first();

        if (existingAgent) {
          throw boom.conflict("Agent with this name already exists");
        }
      }

      // If creating a new version
      if (createVersion) {
        // Create a new version with updated data and incremented version number
        const newAgent = await Agent.query(trx).insert({
          ...agent,
          id: undefined, // Let the database generate a new ID
          name: data.name || agent.name,
          description:
            data.description !== undefined
              ? data.description
              : agent.description,
          key_words: data.key_words || agent.key_words,
          variables: data.variables || agent.variables, // Include variables
          status: "draft", // Reset status to draft
          is_active: false, // Deactivate new version
          approved_by: null,
          approved_at: null,
          ai_character:
            data.ai_character !== undefined
              ? data.ai_character
              : agent.ai_character,
          global_rules: data.global_rules || agent.global_rules,
          agent_definition: data.agent_definition || agent.agent_definition,
          metadata: data.metadata || agent.metadata,
          version: agent.version + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        logger.info(
          `Created new agent version: ${newAgent.id} (version ${newAgent.version})`,
        ); // Check if we have nodes definition
        if (
          newAgent.agent_definition?.nodes &&
          Array.isArray(newAgent.agent_definition.nodes) &&
          !isEmptyArray(newAgent.agent_definition.nodes) &&
          newAgent.agent_definition?.connections &&
          Array.isArray(newAgent.agent_definition.connections) &&
          !isEmptyArray(newAgent.agent_definition.connections)
        ) {
          const agent_definition = await exportFlow(newAgent.agent_definition);

          // Create node records and related AI configs
          if (Array.isArray(agent_definition) && agent_definition.length > 0) {
            // Process nodes and create them with their AI configs
            await Promise.all(
              agent_definition?.map(async (nodeData) => {
                // Extract AI config if it exists
                const aiConfigData = nodeData.ai_config || {};
                delete nodeData.ai_config;

                // Prepare node data
                const agentNode = {
                  ...nodeData,
                  agent_id: newAgent.id,
                };
                // Create the node first
                const createdNode = await AgentNode.query(trx).insert(
                  agentNode,
                );

                // If AI config exists, create it and link it to the node
                if (Object.keys(aiConfigData).length > 0) {
                  const aiConfig = await AIConfig.query(trx).insert({
                    node_id: createdNode.id,
                    system_prompt: aiConfigData.system_prompt || null,
                    ai_provider: aiConfigData.ai_provider || "gpt",
                    model: aiConfigData.model || "gpt-4o",
                    max_tokens: aiConfigData.max_tokens || 1024,
                    temperature: aiConfigData.temperature || 0.7,
                    context_input: aiConfigData.context_input || null,
                  });

                  // Update the node with the AI config reference
                  await AgentNode.query(trx).findById(createdNode.id).patch({
                    ai_config_id: aiConfig.id,
                  });
                }
              }),
            );
          }
        }

        return newAgent;
      } else {
        // Update the existing agent
        const updates = {};

        if (data.name) updates.name = data.name;
        if (data.description !== undefined)
          updates.description = data.description;
        if (data.key_words) updates.key_words = data.key_words;
        if (data.variables) updates.variables = data.variables; // Include variables in updates
        if (data.ai_character !== undefined)
          updates.ai_character = data.ai_character;
        if (data.global_rules) updates.global_rules = data.global_rules;
        if (data.agent_definition)
          updates.agent_definition = data.agent_definition;
        if (data.metadata) updates.metadata = data.metadata;

        updates.updated_at = new Date().toISOString();
        const updatedAgent = await Agent.query(trx).patchAndFetchById(
          id,
          updates,
        );

        // Process agent nodes if agent_definition is updated
        if (data.agent_definition) {
          // First, delete existing nodes and their AI configs for this agent
          const existingNodes = await AgentNode.query(trx).where(
            "agent_id",
            id,
          );

          if (existingNodes.length > 0) {
            const nodeIds = existingNodes.map((node) => node.id);

            // Delete AI configs first (due to foreign key constraints)
            await AIConfig.query(trx).whereIn("node_id", nodeIds).del();

            // Then delete the nodes
            await AgentNode.query(trx).where("agent_id", id).del();

            logger.info(
              `Deleted ${existingNodes.length} existing nodes for agent ${id}`,
            );
          }

          // Check if we have nodes definition to create new ones
          if (
            data.agent_definition?.nodes &&
            Array.isArray(data.agent_definition.nodes) &&
            !isEmptyArray(data.agent_definition.nodes) &&
            data.agent_definition?.connections &&
            Array.isArray(data.agent_definition.connections) &&
            !isEmptyArray(data.agent_definition.connections)
          ) {
            const agent_definition = await exportFlow(data.agent_definition);

            // Create new node records and related AI configs
            if (
              Array.isArray(agent_definition) &&
              agent_definition.length > 0
            ) {
              await Promise.all(
                agent_definition?.map(async (nodeData) => {
                  // Extract AI config if it exists
                  const aiConfigData = nodeData.ai_config || {};
                  delete nodeData.ai_config;

                  // Prepare node data
                  const agentNode = {
                    ...nodeData,
                    agent_id: updatedAgent.id,
                  };

                  // Create the node first
                  const createdNode = await AgentNode.query(trx).insert(
                    agentNode,
                  );

                  // If AI config exists, create it and link it to the node
                  if (Object.keys(aiConfigData).length > 0) {
                    const aiConfig = await AIConfig.query(trx).insert({
                      node_id: createdNode.id,
                      system_prompt: aiConfigData.system_prompt || null,
                      ai_provider: aiConfigData.ai_provider || "gpt",
                      model: aiConfigData.model || "gpt-4o",
                      max_tokens: aiConfigData.max_tokens || 1024,
                      temperature: aiConfigData.temperature || 0.7,
                      context_input: aiConfigData.context_input || null,
                    });

                    // Update the node with the AI config reference
                    await AgentNode.query(trx).findById(createdNode.id).patch({
                      ai_config_id: aiConfig.id,
                    });
                  }
                }),
              );

              logger.info(
                `Created ${agent_definition.length} new nodes for updated agent ${updatedAgent.id}`,
              );
            }
          }
        }

        logger.info(`Updated agent: ${updatedAgent.id}`);

        return updatedAgent;
      }
    } catch (error) {
      logger.error(`Error updating agent ${id}:`, error);
      if (error.isBoom) {
        throw error;
      }
      if (error.code === "23505") {
        throw boom.conflict("Agent with this name already exists");
      }
      throw boom.badImplementation("Failed to update agent");
    }
  });
}

/**
 * Delete an agent (soft delete)
 * @param {string} id - Agent ID
 * @param {string} businessId - Business ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteAgent(id, businessId) {
  try {
    // Get the agent
    const agent = await Agent.query()
      .where({
        id,
        business_id: businessId,
      })
      .modify("notDeleted")
      .first();

    if (!agent) {
      throw boom.notFound("Agent not found");
    }

    // Soft delete by setting is_deleted to true
    await Agent.query().patchAndFetchById(id, {
      is_deleted: true,
      updated_at: new Date().toISOString(),
    });

    logger.info(`Deleted agent: ${id}`);

    return true;
  } catch (error) {
    logger.error(`Error deleting agent ${id}:`, error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to delete agent");
  }
}

/**
 * Submit an agent for approval
 * @param {string} id - Agent ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Updated agent
 */
async function submitAgent(id, businessId) {
  try {
    // Get the agent
    const agent = await Agent.query()
      .where({
        id,
        business_id: businessId,
      })
      .modify("notDeleted")
      .first();

    if (!agent) {
      throw boom.notFound("Agent not found");
    }

    // Only draft agents can be submitted
    if (agent.status !== "draft") {
      throw boom.badRequest(
        `Cannot submit agent with status '${agent.status}'. Only draft agents can be submitted.`,
      );
    }

    // Update the agent status
    const updatedAgent = await Agent.query().patchAndFetchById(id, {
      status: "pending_approval",
      updated_at: new Date().toISOString(),
    });

    logger.info(`Submitted agent for approval: ${id}`);

    return updatedAgent;
  } catch (error) {
    logger.error(`Error submitting agent ${id}:`, error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to submit agent");
  }
}

/**
 * Approve an agent
 * @param {string} id - Agent ID
 * @param {string} businessId - Business ID
 * @param {string} approverId - Approver's user ID
 * @returns {Promise<Object>} - Updated agent
 */
async function approveAgent(id, businessId, approverId) {
  try {
    // Get the agent
    const agent = await Agent.query()
      .where({
        id,
        business_id: businessId,
      })
      .modify("notDeleted")
      .first();

    if (!agent) {
      throw boom.notFound("Agent not found");
    }

    // Only pending agents can be approved
    if (agent.status !== "pending_approval") {
      throw boom.badRequest(
        `Cannot approve agent with status '${agent.status}'. Only pending agents can be approved.`,
      );
    }

    // Update the agent status
    const updatedAgent = await Agent.query().patchAndFetchById(id, {
      status: "approved",
      approved_by: approverId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    logger.info(`Approved agent: ${id} by user: ${approverId}`);

    return updatedAgent;
  } catch (error) {
    logger.error(`Error approving agent ${id}:`, error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to approve agent");
  }
}

/**
 * Reject an agent
 * @param {string} id - Agent ID
 * @param {string} businessId - Business ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} - Updated agent
 */
async function rejectAgent(id, businessId, reason) {
  try {
    // Get the agent
    const agent = await Agent.query()
      .where({
        id,
        business_id: businessId,
      })
      .modify("notDeleted")
      .first();

    if (!agent) {
      throw boom.notFound("Agent not found");
    }

    // Only pending agents can be rejected
    if (agent.status !== "pending_approval") {
      throw boom.badRequest(
        `Cannot reject agent with status '${agent.status}'. Only pending agents can be rejected.`,
      );
    }

    // Update the agent status and store rejection reason in metadata
    const metadata = {
      ...(agent.metadata || {}),
      rejection_reason: reason,
      rejected_at: new Date().toISOString(),
    };

    const updatedAgent = await Agent.query().patchAndFetchById(id, {
      status: "rejected",
      metadata,
      updated_at: new Date().toISOString(),
    });

    logger.info(`Rejected agent: ${id} with reason: ${reason}`);

    return updatedAgent;
  } catch (error) {
    logger.error(`Error rejecting agent ${id}:`, error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to reject agent");
  }
}

/**
 * Toggle agent active status
 * @param {string} id - Agent ID
 * @param {string} businessId - Business ID
 * @param {boolean} isActive - New active status
 * @returns {Promise<Object>} - Updated agent
 */
async function toggleAgentStatus(id, businessId, isActive) {
  try {
    // Get the agent
    const agent = await Agent.query()
      .where({
        id,
        business_id: businessId,
      })
      .modify("notDeleted")
      .first();

    if (!agent) {
      throw boom.notFound("Agent not found");
    }

    // Only approved agents can be activated
    if (isActive && agent.status !== "approved") {
      throw boom.badRequest(
        `Cannot activate agent with status '${agent.status}'. Only approved agents can be activated.`,
      );
    }

    // Update the agent status
    const updatedAgent = await Agent.query().patchAndFetchById(id, {
      is_active: isActive,
      updated_at: new Date().toISOString(),
    });

    logger.info(
      `Toggled agent status: ${id} to ${isActive ? "active" : "inactive"}`,
    );

    return updatedAgent;
  } catch (error) {
    logger.error(`Error toggling agent status ${id}:`, error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to toggle agent status");
  }
}

/**
 * Clone an agent
 * @param {string} id - Agent ID to clone
 * @param {string} businessId - Business ID
 * @param {Object} data - New agent data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Cloned agent
 */
async function cloneAgent(id, businessId, data, userId) {
  return await transaction(async (trx) => {
    try {
      // Get the source agent
      const sourceAgent = await Agent.query(trx)
        .where({
          id,
          business_id: businessId,
        })
        .modify("notDeleted")
        .first();

      if (!sourceAgent) {
        throw boom.notFound("Source agent not found");
      }

      // Check if name is available
      const existingAgent = await Agent.query(trx)
        .where({
          business_id: businessId,
          name: data.name,
        })
        .modify("notDeleted")
        .first();

      if (existingAgent) {
        throw boom.conflict("Agent with this name already exists");
      }

      // Prepare the clone data
      const cloneData = {
        business_id: businessId,
        name: data.name,
        description: data.description || sourceAgent.description,
        key_words: sourceAgent.key_words,
        variables: sourceAgent.variables, // Include variables when cloning
        created_by: userId,
        status: "draft", // Cloned agent always starts as draft
        is_active: false,
        agent_definition: sourceAgent.agent_definition,
        metadata: {
          ...(sourceAgent.metadata || {}),
          cloned_from: sourceAgent.id,
          cloned_at: new Date().toISOString(),
        },
        version: 1, // Reset version counter
      };

      // Include AI configuration if requested
      if (data.include_ai_config !== false) {
        cloneData.ai_character = sourceAgent.ai_character;
        cloneData.global_rules = sourceAgent.global_rules;
      }

      // Create the cloned agent
      const clonedAgent = await Agent.query(trx).insert(cloneData);

      logger.info(`Cloned agent: ${sourceAgent.id} to ${clonedAgent.id}`); // Check if we have nodes definition
      if (
        clonedAgent?.agent_definition?.nodes &&
        Array.isArray(clonedAgent.agent_definition.nodes) &&
        !isEmptyArray(clonedAgent.agent_definition.nodes) &&
        clonedAgent?.agent_definition?.connections &&
        Array.isArray(clonedAgent.agent_definition.connections) &&
        !isEmptyArray(clonedAgent.agent_definition.connections)
      ) {
        const agent_definition = await exportFlow(
          clonedAgent?.agent_definition,
        );

        // Create node records and related AI configs
        if (Array.isArray(agent_definition) && agent_definition.length > 0) {
          // Process nodes and create them with their AI configs
          await Promise.all(
            agent_definition?.map(async (nodeData) => {
              // Extract AI config if it exists
              const aiConfigData = nodeData.ai_config || {};
              delete nodeData.ai_config;

              // Prepare node data
              const agentNode = {
                agent_id: clonedAgent.id,
              };

              // Create the node first
              const createdNode = await AgentNode.query(trx).insert(agentNode);

              // If AI config exists, create it and link it to the node
              if (Object.keys(aiConfigData).length > 0) {
                const aiConfig = await AIConfig.query(trx).insert({
                  node_id: createdNode.id,
                  system_prompt: aiConfigData.system_prompt || null,
                  ai_provider: aiConfigData.ai_provider || "gpt",
                  model: aiConfigData.model || "gpt-4o",
                  max_tokens: aiConfigData.max_tokens || 1024,
                  temperature: aiConfigData.temperature || 0.7,
                  context_input: aiConfigData.context_input || null,
                });

                // Update the node with the AI config reference
                await AgentNode.query(trx).findById(createdNode.id).patch({
                  ai_config_id: aiConfig.id,
                });
              }
            }),
          );
          logger.info(
            `Created ${agent_definition.length} nodes for agent ${clonedAgent.id}`,
          );
        }
      }

      return clonedAgent;
    } catch (error) {
      logger.error(`Error cloning agent ${id}:`, error);
      if (error.isBoom) {
        throw error;
      }
      if (error.code === "23505") {
        throw boom.conflict("Agent with this name already exists");
      }
      throw boom.badImplementation("Failed to clone agent");
    }
  });
}

/**
 * Get all nodes with their AI configurations for a specific agent, optionally filtered by step
 * @param {string} agentId - Agent ID
 * @param {string} businessId - Business ID
 * @param {string} [step] - Optional step identifier to filter nodes
 * @returns {Promise<Object>} - Object with agent_id and array of nodes with their AI configurations
 */
async function getAgentNodesWithConfig(agentId, businessId, step = null) {
  try {
    // Verify the agent exists and belongs to the business
    const agent = await Agent.query()
      .where({ id: agentId, business_id: businessId })
      .modify("notDeleted")
      .first();

    if (!agent) {
      throw boom.notFound("Agent not found");
    }

    // Add debug info about the agent
    logger.info(`Found agent: ${agent.name} (${agent.id})`);

    // Build query for nodes
    let nodesQuery = AgentNode.query().where({ agent_id: agentId });

    // Apply step filter if specified
    if (step) {
      logger.info(`Filtering nodes by step: ${step}`);
      nodesQuery = nodesQuery.where("step", step);
    }

    // Get nodes for the agent
    const nodes = await nodesQuery;

    logger.debug(
      `Retrieved ${nodes.length} nodes${step ? ` for step ${step}` : ""}`,
    );

    // Fetch AI configs for each node if they exist
    if (nodes.length > 0) {
      const nodeIds = nodes.map((node) => node.id);
      const aiConfigs = await AIConfig.query().whereIn("node_id", nodeIds);

      // Map AI configs to their respective nodes
      const nodesWithConfig = nodes.map((node) => {
        const config = aiConfigs.find((config) => config.node_id === node.id);
        return {
          ...node,
          ai_config: config || null,
        };
      });

      logger.info(
        `Retrieved ${nodes.length} nodes with AI configs for agent ${agentId}${
          step ? ` and step ${step}` : ""
        }`,
      );

      return {
        agent_id: agentId,
        step: step || null,
        nodes: nodesWithConfig,
      };
    }

    return {
      agent_id: agentId,
      step: step || null,
      nodes: [],
    };
  } catch (error) {
    logger.error(
      `Error getting nodes with config for agent ${agentId}${
        step ? ` and step ${step}` : ""
      }:`,
      error,
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation(
      "Failed to fetch agent nodes with configurations",
    );
  }
}

/**
 * Get nodes by agent ID and step
 * @param {string} agentId - Agent ID
 * @param {string} step - Step identifier
 * @param {string} businessId - Business ID (optional for validation)
 * @returns {Promise<Array>} - Array of nodes matching the criteria
 */
async function getNodesByAgentAndStep(agentId, step, businessId = null) {
  try {
    // Validate required parameters
    if (!agentId || !step) {
      logger.warn(`Invalid parameters: agentId=${agentId}, step=${step}`);
      return [];
    }

    // If businessId is provided, validate that the agent belongs to the business
    if (businessId) {
      const agent = await Agent.query()
        .where({ id: agentId, business_id: businessId })
        .modify("notDeleted")
        .first();

      if (!agent) {
        throw boom.notFound(
          "Agent not found or doesn't belong to the specified business",
        );
      }
    }

    // Get nodes that match the agent ID and step
    const nodes = await AgentNode.query().where({
      agent_id: agentId,
      step: step,
    });

    logger.info(
      `Found ${nodes.length} nodes for agent ${agentId} and step ${step}`,
    );

    return nodes;
  } catch (error) {
    logger.error(
      `Error getting nodes for agent ${agentId} and step ${step}:`,
      error,
    );
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to fetch nodes by agent and step");
  }
}

module.exports = {
  getAllAgents,
  getAgentById,
  getAgentsByIds,
  createAgent,
  updateAgent,
  deleteAgent,
  submitAgent,
  approveAgent,
  rejectAgent,
  toggleAgentStatus,
  cloneAgent,
  getAgentNodesWithConfig,
  getNodesByAgentAndStep,
};
