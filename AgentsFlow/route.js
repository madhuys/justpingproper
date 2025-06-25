// api/Webhooks/route.js
const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { karixMiddleware, metaMiddleware } = require("./middleware");
const { webhookRateLimit } = require("./webhookFlowManager");
const c = require("../system/utils/controller-handler");

// Meta webhook routes
router.get(
  "/meta",
  c(controller.verifyMetaWebhook, (req) => [req, res]),
);

router.post(
  "/meta",
  webhookRateLimit, // Apply rate limiting
  metaMiddleware(),
  c(controller.mainAgentFlowController, (req) => [req]),
);

// Karix webhook routes
router.post(
  "/karix",
  webhookRateLimit, // Apply rate limiting
  karixMiddleware({
    businessId: "2aeb2c4f-4343-4bbf-90f0-3caedb38fe33",
  }),
  c(controller.mainAgentFlowController, (req) => [req]),
);

module.exports = router;
