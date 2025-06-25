// api/Channel/route.js
const express = require("express");
const router = express.Router();
const controller = require("./controller");
const schema = require("./schema");
const c = require("../../system/utils/controller-handler");
const { celebrate } = require("celebrate");
const { hasPermission } = require("../../system/middleware/auth");

// Channel Operations (admin routes)
router.post(
    "/",
    hasPermission("channels.create"),
    celebrate(schema.channelSchema, schema.options),
    c(controller.createChannel, (req) => [
        req.body,
        req.user.userId,
        req.user.businessId,
    ]),
);

router.get(
    "/",
    hasPermission("channels.read"),
    c(controller.getAllChannels, (req) => [req]),
);

router.get(
    "/:channelId",
    hasPermission("channels.read"),
    celebrate(schema.channelIdSchema, schema.options),
    c(controller.getChannelById, (req) => [req.params.channelId]),
);

router.put(
    "/:channelId",
    hasPermission("channels.update"),
    celebrate(schema.updateChannelSchema, schema.options),
    c(controller.updateChannel, (req) => [req.params.channelId, req.body]),
);

router.delete(
    "/:channelId",
    hasPermission("channels.delete"),
    celebrate(schema.channelIdSchema, schema.options),
    c(controller.deleteChannel, (req) => [req.params.channelId]),
);

// Business Channel Operations
router.get(
    "/business/channels",
    hasPermission("business_channels.read"),
    c(controller.getBusinessChannels, (req) => [req]),
);

router.get(
    "/business/channels/:businessChannelId",
    hasPermission("business_channels.read"),
    celebrate(schema.businessChannelIdSchema, schema.options),
    c(controller.getBusinessChannelById, (req) => [req]),
);

router.post(
    "/business/channels",
    hasPermission("business_channels.create"),
    celebrate(schema.businessChannelSchema, schema.options),
    c(controller.createBusinessChannel, (req) => [req]),
);

router.put(
    "/business/channels/:businessChannelId",
    hasPermission("business_channels.update"),
    celebrate(schema.updateBusinessChannelSchema, schema.options),
    c(controller.updateBusinessChannel, (req) => [req]),
);

router.delete(
    "/business/channels/:businessChannelId",
    hasPermission("business_channels.delete"),
    celebrate(schema.businessChannelIdSchema, schema.options),
    c(controller.deleteBusinessChannel, (req) => [req]),
);

router.post(
    "/business/channels/:businessChannelId/test",
    hasPermission("business_channels.update"),
    celebrate(schema.testBusinessChannelSchema, schema.options),
    c(controller.testBusinessChannel, (req) => [req]),
);

// Provider-specific endpoints
// Meta WhatsApp
router.get(
    "/providers/meta/webhook/verify",
    celebrate(schema.metaVerifySchema, schema.options),
    c(controller.verifyMetaWebhook),
);

router.post(
    "/providers/meta/webhook",
    c(controller.processMetaWebhook, (req) => [req]),
);

// Wati
router.post(
    "/providers/wati/verify",
    hasPermission("integrations.manage"),
    celebrate(schema.watiVerifySchema, schema.options),
    c(controller.verifyWatiConnection, (req) => [req]),
);

// Gupshup
router.get(
    "/providers/gupshup/apps",
    hasPermission("integrations.manage"),
    celebrate(schema.gupshupAppsSchema, schema.options),
    c(controller.getGupshupApps, (req) => [req]),
);

// Karix
router.post(
    "/providers/karix/verify",
    hasPermission("integrations.manage"),
    celebrate(schema.karixVerifySchema, schema.options),
    c(controller.verifyKarixCredentials, (req) => [req]),
);

module.exports = router;
