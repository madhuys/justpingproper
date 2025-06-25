// api/Templates/route.js
const express = require("express");
const router = express.Router();
const controller = require("./controller");
const schema = require("./schema");
const c = require("../../system/utils/controller-handler");
const { celebrate } = require("celebrate");
const { hasPermission } = require("../../system/middleware/auth");

router.post(
    "/",
    hasPermission("templates.create"),
    celebrate(schema.createTemplateSchema, schema.options),
    c(controller.createTemplate, (req) => [
        req.body,
        req.user.businessId,
        req.user.userId,
    ]),
);

router.get(
    "/",
    hasPermission("templates.read"),
    celebrate(schema.getTemplatesSchema, schema.options),
    c(controller.getTemplates, (req) => [req.user.businessId, req.query]),
);

router.get(
    "/:template_id",
    hasPermission("templates.read"),
    celebrate(schema.templateIdSchema, schema.options),
    c(controller.getTemplateById, (req) => [req.params.template_id]),
);

router.get(
    "/:template_id/status",
    hasPermission("templates.read"),
    celebrate(schema.templateIdSchema, schema.options),
    c(controller.checkTemplateStatus, (req) => [
        req.user.businessId,
        req.params.template_id,
    ]),
);

router.put(
    "/:template_id",
    hasPermission("templates.update"),
    celebrate(
        { ...schema.templateIdSchema, ...schema.updateTemplateSchema },
        schema.options,
    ),
    c(controller.updateTemplate, (req) => [
        req.params.template_id,
        req.body,
        req.user.userId,
    ]),
);

router.delete(
    "/:template_id",
    hasPermission("templates.delete"),
    celebrate(schema.templateIdSchema, schema.options),
    c(controller.deleteTemplate, (req) => [
        req.params.template_id,
        req.user.businessId,
    ]),
);

module.exports = router;
