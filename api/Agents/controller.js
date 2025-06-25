// api/Agents/controller.js
const boom = require("@hapi/boom");
const service = require("./service");
const logger = require("../../system/utils/logger");
const {
    extractPaginationParams,
    extractFilters,
} = require("../../system/utils/pagination");

/**
 * Get all agents
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} - Response with agents list
 */
module.exports.getAllAgents = async (req) => {
    try {
        const businessId = req.user.businessId;

        // Extract pagination and filter parameters
        const pagination = extractPaginationParams(req.query);
        const filters = extractFilters(req.query);

        // Get agents from service
        const result = await service.getAllAgents(
            filters,
            pagination,
            businessId,
        );

        return {
            success: true,
            data: result.agents,
            pagination: result.pagination,
        };
    } catch (error) {
        logger.error("Error in getAllAgents controller:", error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to fetch agents");
    }
};

/**
 * Get an agent by ID
 * @param {String} agentId - Agent ID
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} - Response with agent data
 */
module.exports.getAgentById = async (agentId, req) => {
    try {
        const businessId = req.user.businessId;
        const includeDefinition =
            req.query.include_definition === "true" ||
            req.query.include_definition === true;

        const agent = await service.getAgentById(agentId, businessId, {
            includeDefinition,
        });

        return {
            success: true,
            data: {
                agent,
            },
        };
    } catch (error) {
        logger.error(`Error in getAgentById controller for ${agentId}:`, error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to fetch agent");
    }
};

/**
 * Create a new agent
 * @param {Object} data - Agent data
 * @param {String} businessId - Business ID
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Response with created agent
 */
module.exports.createAgent = async (data, businessId, userId) => {
    try {
        const agent = await service.createAgent(data, businessId, userId);

        return {
            success: true,
            statusCode: 201,
            message: "Agent created successfully",
            data: {
                agent,
            },
        };
    } catch (error) {
        logger.error("Error in createAgent controller:", error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to create agent");
    }
};

/**
 * Update an existing agent
 * @param {String} agentId - Agent ID
 * @param {Object} data - Updated agent data
 * @param {String} businessId - Business ID
 * @returns {Promise<Object>} - Response with updated agent
 */
module.exports.updateAgent = async (agentId, data, businessId) => {
    try {
        const createVersion = data.create_version === true;
        delete data.create_version; // Remove from data before passing to service

        const agent = await service.updateAgent(
            agentId,
            data,
            businessId,
            createVersion,
        );

        return {
            success: true,
            message: createVersion
                ? "New agent version created successfully"
                : "Agent updated successfully",
            data: {
                agent,
            },
        };
    } catch (error) {
        logger.error(`Error in updateAgent controller for ${agentId}:`, error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to update agent");
    }
};

/**
 * Delete an agent
 * @param {String} agentId - Agent ID
 * @param {String} businessId - Business ID
 * @returns {Promise<Object>} - Response with success message
 */
module.exports.deleteAgent = async (agentId, businessId) => {
    try {
        await service.deleteAgent(agentId, businessId);

        return {
            success: true,
            message: "Agent deleted successfully",
        };
    } catch (error) {
        logger.error(`Error in deleteAgent controller for ${agentId}:`, error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to delete agent");
    }
};

/**
 * Submit an agent for approval
 * @param {String} agentId - Agent ID
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} - Response with updated agent
 */
module.exports.submitAgent = async (agentId, req) => {
    try {
        const businessId = req.user.businessId;

        const agent = await service.submitAgent(agentId, businessId);

        return {
            success: true,
            message: "Agent submitted for approval",
            data: {
                agent: {
                    id: agent.id,
                    status: agent.status,
                    updated_at: agent.updated_at,
                },
            },
        };
    } catch (error) {
        logger.error(`Error in submitAgent controller for ${agentId}:`, error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to submit agent for approval");
    }
};

/**
 * Approve an agent
 * @param {String} agentId - Agent ID
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} - Response with approved agent
 */
module.exports.approveAgent = async (agentId, req) => {
    try {
        const businessId = req.user.businessId;
        const approverId = req.user.userId;

        const agent = await service.approveAgent(
            agentId,
            businessId,
            approverId,
        );

        return {
            success: true,
            message: "Agent approved successfully",
            data: {
                agent: {
                    id: agent.id,
                    status: agent.status,
                    approved_by: agent.approved_by,
                    approved_at: agent.approved_at,
                    updated_at: agent.updated_at,
                },
            },
        };
    } catch (error) {
        logger.error(`Error in approveAgent controller for ${agentId}:`, error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to approve agent");
    }
};

/**
 * Reject an agent
 * @param {String} agentId - Agent ID
 * @param {Object} data - Rejection data with reason
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} - Response with rejected agent
 */
module.exports.rejectAgent = async (agentId, data, req) => {
    try {
        const businessId = req.user.businessId;

        const agent = await service.rejectAgent(
            agentId,
            businessId,
            data.reason,
        );

        return {
            success: true,
            message: "Agent rejected",
            data: {
                agent: {
                    id: agent.id,
                    status: agent.status,
                    rejection_reason: agent.metadata?.rejection_reason,
                    updated_at: agent.updated_at,
                },
            },
        };
    } catch (error) {
        logger.error(`Error in rejectAgent controller for ${agentId}:`, error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to reject agent");
    }
};

/**
 * Toggle agent active status
 * @param {String} agentId - Agent ID
 * @param {Object} data - Toggle data with is_active flag
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} - Response with updated agent
 */
module.exports.toggleAgentStatus = async (agentId, data, req) => {
    try {
        const businessId = req.user.businessId;

        const agent = await service.toggleAgentStatus(
            agentId,
            businessId,
            data.is_active,
        );

        return {
            success: true,
            message: `Agent ${
                data.is_active ? "activated" : "deactivated"
            } successfully`,
            data: {
                agent: {
                    id: agent.id,
                    is_active: agent.is_active,
                    updated_at: agent.updated_at,
                },
            },
        };
    } catch (error) {
        logger.error(
            `Error in toggleAgentStatus controller for ${agentId}:`,
            error,
        );
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to toggle agent status");
    }
};

/**
 * Clone an agent
 * @param {String} agentId - Agent ID to clone
 * @param {Object} data - Clone data with new name
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} - Response with cloned agent
 */
module.exports.cloneAgent = async (agentId, data, req) => {
    try {
        const businessId = req.user.businessId;
        const userId = req.user.userId;

        const agent = await service.cloneAgent(
            agentId,
            businessId,
            data,
            userId,
        );

        return {
            success: true,
            message: "Agent cloned successfully",
            data: {
                agent: {
                    id: agent.id,
                    name: agent.name,
                    status: agent.status,
                    created_at: agent.created_at,
                    updated_at: agent.updated_at,
                    version: agent.version,
                },
            },
        };
    } catch (error) {
        logger.error(`Error in cloneAgent controller for ${agentId}:`, error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to clone agent");
    }
};
