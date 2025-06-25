// api/Broadcast/route.js
const express = require("express");
const router = express.Router();
const controller = require("./controller");
const schema = require("./schema");
const c = require("../../system/utils/controller-handler");
const { celebrate } = require("celebrate");
const { hasPermission } = require("../../system/middleware/auth");

router.post(
    "/:campaign_id",
    hasPermission("broadcasts.create"),
    celebrate(schema.createBroadcastSchema, schema.options),
    c(controller.createBroadcast, (req) => [
        req.params.campaign_id,
        req.body,
        req,
    ]),
);

router.put(
    "/:broadcast_id",
    hasPermission("broadcasts.update"),
    celebrate(schema.updateBroadcastSchema, schema.options),
    c(controller.updateBroadcast, (req) => [
        req.params.broadcast_id,
        req.body,
        req,
    ]),
);

router.delete(
    "/:broadcast_id",
    hasPermission("broadcasts.delete"),
    celebrate(schema.deleteBroadcastSchema, schema.options),
    c(controller.deleteBroadcast, (req) => [req.params.broadcast_id, req]),
);

router.patch(
    "/:broadcast_id/status",
    hasPermission("broadcasts.update"),
    celebrate(schema.updateBroadcastStatusSchema, schema.options),
    c(controller.updateBroadcastStatus, (req) => [
        req.params.broadcast_id,
        req.body,
        req,
    ]),
);

router.post(
    "/:broadcast_id/clone",
    hasPermission("broadcasts.create"),
    celebrate(schema.cloneBroadcastSchema, schema.options),
    c(controller.cloneBroadcast, (req) => [
        req.params.broadcast_id,
        req.body,
        req,
    ]),
);

router.get(
    "/:broadcast_id/analytics",
    hasPermission("broadcasts.read"),
    celebrate(schema.getBroadcastAnalyticsSchema, schema.options),
    c(controller.getBroadcastAnalytics, (req) => [
        req.params.broadcast_id,
        req,
    ]),
);

router.get(
    "/:broadcast_id/analytics/export",
    hasPermission("broadcasts.read"),
    celebrate(schema.exportBroadcastAnalyticsSchema, schema.options),
    // This route needs direct access to the response object for file download
    (req, res, next) => {
        try {
            return controller.exportBroadcastAnalytics(
                req.params.broadcast_id,
                req,
                res,
            );
        } catch (error) {
            next(error);
        }
    },
);

router.post(
    "/:broadcast_id/retarget-failed",
    hasPermission("broadcasts.update"),
    celebrate(schema.retargetFailedRecipientsSchema, schema.options),
    c(controller.retargetFailedRecipients, (req) => [
        req.params.broadcast_id,
        req.body,
        req,
    ]),
);

module.exports = router;
