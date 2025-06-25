const express = require("express");
const router = express.Router();
const authController = require("./controller");
const { validateRequest } = require("../../system/middleware/validate-request");
const { hasPermission, verifyToken } = require("../../system/middleware/auth");
const schema = require("./schema");
const controllerHandler = require("../../system/utils/controller-handler");

// Public routes
router.post(
  "/register",
  validateRequest(schema.registerSchema),
  controllerHandler(authController.registerUser, (req) => [req.body])
);

router.post(
  "/login",
  validateRequest(schema.loginSchema),
  controllerHandler(authController.loginUser, (req) => [req.body])
);

router.post(
  "/refresh-token",
  validateRequest(schema.refreshTokenSchema),
  controllerHandler(authController.refreshToken, (req) => [req.body])
);

router.post(
  "/forgot-password",
  validateRequest(schema.passwordResetRequestSchema),
  controllerHandler(authController.requestPasswordReset, (req) => [req.body])
);

router.post(
  "/reset-password",
  validateRequest(schema.passwordResetSchema),
  controllerHandler(authController.resetPassword, (req) => [req.body])
);

// Protected routes
router.get(
  "/me",
  verifyToken,
  controllerHandler(authController.getCurrentUser, (req) => [req.user])
);

router.put(
  "/change-password",
  verifyToken,
  validateRequest(schema.changePasswordSchema),
  controllerHandler(authController.changePassword, (req) => [
    req.body,
    req.user,
  ])
);

router.post(
  "/logout",
  verifyToken,
  controllerHandler(authController.logoutUser, (req) => {
    const token = req.headers.authorization.split(" ")[1];
    return [token];
  })
);

module.exports = router;
