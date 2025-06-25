// api/ConversationFlow/route.js
const express = require("express");
const controller = require("./controller");
const schema = require("./schema");
const { validateRequest } = require("../../system/middleware/validate-request");
const controllerHandler = require("../../system/utils/controller-handler");

const router = express.Router();

/**
 * @route GET /conversations/broadcast/:broadcastId
 * @desc Get conversations by broadcast ID
 * @access Private
 */
router.get(
  "/conversations/broadcast/:broadcastId",
  validateRequest(schema.getConversationsByBroadcastId),
  controllerHandler(controller.getConversationsByBroadcastId, (req) => [req]),
);

/**
 * @route GET /conversations/status/:status
 * @desc Get conversations by status
 * @access Private
 */
router.get(
  "/conversations/status/:status",
  validateRequest(schema.getConversationsByStatus),
  controllerHandler(controller.getConversationsByStatus, (req) => [req]),
);

/**
 * @route GET /conversations/details/:conversationId
 * @desc Get single conversation by ID with detailed information
 * @access Private
 */
router.get(
  "/conversations/details/:conversationId",
  validateRequest(schema.getConversationById),
  controllerHandler(controller.getConversationById, (req) => [req]),
);

/**
 * @route GET /conversations/:conversationId
 * @desc Get conversation details and progress
 * @access Private
 */
router.get(
  "/conversations/:conversationId",
  validateRequest(schema.getConversation),
  controllerHandler(controller.getConversation, (req) => [req]),
);

/**
 * @route POST /conversations/:conversationId/reset
 * @desc Reset conversation to a specific step
 * @access Private
 */
router.post(
  "/conversations/:conversationId/reset",
  validateRequest(schema.resetConversation),
  controllerHandler(controller.resetConversation, (req) => [req]),
);

/**
 * @route GET /agents/:agentId/flow
 * @desc Get agent flow definition and structure
 * @access Private
 */
router.get(
  "/agents/:agentId/flow",
  validateRequest(schema.getAgentFlow),
  controllerHandler(controller.getAgentFlow, (req) => [req]),
);

/**
 * @route GET /agents/:agentId/validate
 * @desc Validate agent flow configuration
 * @access Private
 */
router.get(
  "/agents/:agentId/validate",
  validateRequest(schema.validateFlow),
  controllerHandler(controller.validateFlow, (req) => [req]),
);

/**
 * @route GET /analytics
 * @desc Get conversation analytics and metrics
 * @access Private
 */
router.get(
  "/analytics",
  validateRequest(schema.getAnalytics),
  controllerHandler(controller.getAnalytics, (req) => [req]),
);

/**
 * @route GET /export
 * @desc Export conversation data
 * @access Private
 */
router.get(
  "/export",
  validateRequest(schema.exportData),
  controllerHandler(controller.exportData, (req) => [req]),
);

/**
 * @route GET /health
 * @desc Get conversation flow health dashboard
 * @access Private
 */
router.get(
  "/health",
  validateRequest(schema.getHealthDashboard),
  controllerHandler(controller.getHealthDashboard, (req) => [req]),
);

/**
 * @route GET /conversations/:conversationId/agent-mapping
 * @desc Get agent keywords and IDs from broadcast data using conversation data
 * @access Private
 */
router.get(
  "/conversations/:conversationId/agent-mapping",
  validateRequest(schema.getAgentMappingFromBroadcast),
  controllerHandler(controller.getAgentMappingFromBroadcast, (req) => [req]),
);

/**
 * @route GET /conversations/:conversationId/find-agent/:agentId
 * @desc Find specific agent by ID from broadcast data (strict mode for outbound broadcasts)
 * @access Private
 */
router.get(
  "/conversations/:conversationId/find-agent/:agentId",
  validateRequest(schema.findAgentFromBroadcast),
  controllerHandler(controller.findAgentFromBroadcast, (req) => [req]),
);

/**
 * @route POST /conversations/:conversationId/find-agent-with-fallback
 * @desc Find agent using keyword fallback logic (defaults to first keyword's agent if no match)
 * @access Private
 */
router.post(
  "/conversations/:conversationId/find-agent-with-fallback",
  validateRequest(schema.findAgentWithKeywordFallback),
  controllerHandler(controller.findAgentWithKeywordFallback, (req) => [req]),
);

module.exports = router;
