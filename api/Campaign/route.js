const express = require("express");
const router = express.Router();
const controller = require("./controller");
const schema = require("./schema");
const c = require("../../system/utils/controller-handler");
const { celebrate } = require("celebrate");
const { hasPermission } = require("../../system/middleware/auth");

// List all campaigns
router.get(
    "/",
    hasPermission("campaigns.read"),
    celebrate(schema.listCampaignsSchema, schema.options),
    c(controller.getAllCampaigns, (req) => [req]),
);

// Get campaign by ID
router.get(
    "/:campaign_id",
    hasPermission("campaigns.read"),
    celebrate(schema.getCampaignSchema, schema.options),
    c(controller.getCampaignById, (req) => [req.params.campaign_id, req]),
);

// Create a new campaign
router.post(
    "/",
    hasPermission("campaigns.create"),
    celebrate(schema.createCampaignSchema, schema.options),
    c(controller.createCampaign, (req) => [req.body, req]),
);

// Update an existing campaign
router.put(
    "/:campaign_id",
    hasPermission("campaigns.update"),
    celebrate(schema.updateCampaignSchema, schema.options),
    c(controller.updateCampaign, (req) => [
        req.params.campaign_id,
        req.body,
        req,
    ]),
);

// Delete a campaign
router.delete(
    "/:campaign_id",
    hasPermission("campaigns.delete"),
    celebrate(schema.deleteCampaignSchema, schema.options),
    c(controller.deleteCampaign, (req) => [req.params.campaign_id, req]),
);

// Update campaign status
router.patch(
    "/:campaign_id/status",
    hasPermission("campaigns.update"),
    celebrate(schema.updateCampaignStatusSchema, schema.options),
    c(controller.updateCampaignStatus, (req) => [
        req.params.campaign_id,
        req.body,
        req,
    ]),
);

module.exports = router;
