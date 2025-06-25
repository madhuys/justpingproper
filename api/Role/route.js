const express = require("express");
const router = express.Router();
const roleController = require("./controller");
const { validateRequest } = require("../../system/middleware/validate-request");
const { hasPermission, verifyToken } = require("../../system/middleware/auth");
const schema = require("./schema");
const controllerHandler = require("../../system/utils/controller-handler");

// All routes require authentication
router.use(verifyToken);

// Role management routes
router.get(
  "/",
  hasPermission("roles.read"),
  controllerHandler(roleController.getAllRoles, (req) => [req])
);

router.get(
  "/:roleId",
  hasPermission("roles.read"),
  controllerHandler(roleController.getRoleById, (req) => [req])
);

router.post(
  "/",
  hasPermission("roles.create"),
  validateRequest(schema.createRoleSchema),
  controllerHandler(roleController.createRole, (req) => [req])
);

router.put(
  "/:roleId",
  hasPermission("roles.update"),
  validateRequest(schema.updateRoleSchema),
  controllerHandler(roleController.updateRole, (req) => [req])
);

router.delete(
  "/:roleId",
  hasPermission("roles.delete"),
  controllerHandler(roleController.deleteRole, (req) => [req])
);

// User-role management routes
router.get(
  "/users/:userId/roles",
  hasPermission("users.read"),
  controllerHandler(roleController.getUserRoles, (req) => [req])
);

router.post(
  "/users/:userId/roles",
  hasPermission("users.update"),
  validateRequest(schema.assignRoleSchema),
  controllerHandler(roleController.assignRoleToUser, (req) => [req])
);

router.put(
  "/users/:userId/roles",
  hasPermission("users.update"),
  validateRequest(schema.updateUserRolesSchema),
  controllerHandler(roleController.updateUserRoles, (req) => [req])
);

router.delete(
  "/users/:userId/roles/:roleId",
  hasPermission("users.update"),
  controllerHandler(roleController.removeRoleFromUser, (req) => [req])
);

module.exports = router;
