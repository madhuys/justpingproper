// api/Agents/route.js
const express = require("express");
const router = express.Router();
const controller = require("./controller");
const schema = require("./schema");
const c = require("../../system/utils/controller-handler");
const { celebrate } = require("celebrate");
const { hasPermission } = require("../../system/middleware/auth");

// List all agents
router.get(
    "/",
    hasPermission("agents.read"),
    celebrate(schema.getAgentsSchema, schema.options),
    c(controller.getAllAgents, (req) => [req]),
);

// Get agent by ID
router.get(
    "/:agent_id",
    hasPermission("agents.read"),
    celebrate(schema.agentIdSchema, schema.options),
    c(controller.getAgentById, (req) => [req.params.agent_id, req]),
);

// Create an agent
router.post(
    "/",
    hasPermission("agents.create"),
    celebrate(schema.createAgentSchema, schema.options),
    c(controller.createAgent, (req) => [
        req.body,
        req.user.businessId,
        req.user.userId,
    ]),
);

// Update an agent
router.put(
    "/:agent_id",
    hasPermission("agents.update"),
    celebrate(schema.updateAgentSchema, schema.options),
    c(controller.updateAgent, (req) => [
        req.params.agent_id,
        req.body,
        req.user.businessId,
    ]),
);

// Delete an agent
router.delete(
    "/:agent_id",
    hasPermission("agents.delete"),
    celebrate(schema.agentIdSchema, schema.options),
    c(controller.deleteAgent, (req) => [
        req.params.agent_id,
        req.user.businessId,
    ]),
);

// Submit an agent for approval
router.post(
    "/:agent_id/submit",
    hasPermission("agents.update"),
    celebrate(schema.submitAgentSchema, schema.options),
    c(controller.submitAgent, (req) => [req.params.agent_id, req]),
);

// Approve an agent
router.post(
    "/:agent_id/approve",
    hasPermission("agents.approve"),
    celebrate(schema.approveAgentSchema, schema.options),
    c(controller.approveAgent, (req) => [req.params.agent_id, req]),
);

// Reject an agent
router.post(
    "/:agent_id/reject",
    hasPermission("agents.approve"),
    celebrate(schema.rejectAgentSchema, schema.options),
    c(controller.rejectAgent, (req) => [req.params.agent_id, req.body, req]),
);

// Toggle agent status (activate/deactivate)
router.post(
    "/:agent_id/toggle-status",
    hasPermission("agents.update"),
    celebrate(schema.toggleAgentStatusSchema, schema.options),
    c(controller.toggleAgentStatus, (req) => [
        req.params.agent_id,
        req.body,
        req,
    ]),
);

// Clone an agent
router.post(
    "/:agent_id/clone",
    hasPermission("agents.create"),
    celebrate(schema.cloneAgentSchema, schema.options),
    c(controller.cloneAgent, (req) => [req.params.agent_id, req.body, req]),
);

module.exports = router;
