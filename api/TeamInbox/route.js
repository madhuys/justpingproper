// api/TeamInbox/route.js
const express = require("express");
const router = express.Router();
const controller = require("./controller");
const schema = require("./schema");
const { celebrate } = require("celebrate");
const { hasPermission } = require("../../system/middleware/auth");
const c = require("../../system/utils/controller-handler");

// Conversation routes
router.get(
    "/conversations",
    hasPermission("conversations.read"),
    celebrate({ query: schema.listConversationsQuerySchema }, schema.options),
    c(controller.getConversations, (req) => [req]),
);

router.get(
    "/conversations/statistics",
    hasPermission("conversations.read"),
    celebrate({ query: schema.statisticsQuerySchema }, schema.options),
    c(controller.getStatistics, (req) => [req]),
);

router.get(
    "/conversations/:conversationId",
    hasPermission("conversations.read"),
    celebrate(
        {
            params: schema.conversationIdParamSchema,
            query: schema.conversationDetailsQuerySchema,
        },
        schema.options,
    ),
    c(controller.getConversationDetails, (req) => [req]),
);

router.patch(
    "/conversations/:conversationId/status",
    hasPermission("conversations.update"),
    celebrate(
        {
            params: schema.conversationIdParamSchema,
            body: schema.updateStatusSchema,
        },
        schema.options,
    ),
    c(controller.updateConversationStatus, (req) => [req]),
);

router.patch(
    "/conversations/:conversationId/assign",
    hasPermission("conversations.update"),
    celebrate(
        {
            params: schema.conversationIdParamSchema,
            body: schema.assignConversationSchema,
        },
        schema.options,
    ),
    c(controller.assignConversation, (req) => [req]),
);

router.post(
    "/conversations/:conversationId/messages",
    hasPermission("conversations.message"),
    celebrate(
        {
            params: schema.conversationIdParamSchema,
            body: schema.sendMessageSchema,
        },
        schema.options,
    ),
    c(controller.sendMessage, (req) => [req]),
);

router.post(
    "/conversations/:conversationId/notes",
    hasPermission("conversations.message"),
    celebrate(
        {
            params: schema.conversationIdParamSchema,
            body: schema.sendNoteSchema,
        },
        schema.options,
    ),
    c(controller.sendNote, (req) => [req]),
);

router.post(
    "/conversations/:conversationId/tags",
    hasPermission("conversations.update"),
    celebrate(
        {
            params: schema.conversationIdParamSchema,
            body: schema.addTagSchema,
        },
        schema.options,
    ),
    c(controller.addTag, (req) => [req]),
);

router.delete(
    "/conversations/:conversationId/tags/:tagId",
    hasPermission("conversations.update"),
    celebrate({ params: schema.tagIdParamSchema }, schema.options),
    c(controller.removeTag, (req) => [req]),
);

// Tag routes
router.get(
    "/tags",
    hasPermission("tags.read"),
    c(controller.getTags, (req) => [req]),
);

router.post(
    "/tags",
    hasPermission("tags.create"),
    celebrate({ body: schema.createTagSchema }, schema.options),
    c(controller.createTag, (req) => [req]),
);

module.exports = router;
