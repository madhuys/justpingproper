const boom = require("@hapi/boom");
const crypto = require("crypto");
const logger = require("../../system/utils/logger");
const authService = require("../services/authService");
const authUtils = require("../utils/authUtils");
const emailService = require("../../system/services/Email");
const firebase = require("../../system/config/firebase");

/**
 * Register a new user with business
 * @param {Object} data - Registration data containing business and user info
 * @returns {Promise<Object>} Registration result
 */
const registerUser = async (data) => {
  try {
    // Extract business and user data
    const { business, user } = data;

    //check if business already exists
    const existingBusiness = await authService.getUserByEmail(user.email);
    if (existingBusiness) {
      throw boom.conflict("Business already exists with this email");
    }

    // Start a transaction
    const trx = await authService.startTransaction();

    try {
      // 1. Create the business
      const newBusiness = await authService.createBusiness(business, trx);

      // 2. Create user in Firebase with a random password (user will set their own later)
      const tempPassword = crypto.randomBytes(16).toString("hex");
      let firebaseUser;
      try {
        firebaseUser = await authService.createFirebaseUser({
          email: user.email,
          password: tempPassword, // Temporary random password
          first_name: user.first_name,
          last_name: user.last_name,
        });
      } catch (error) {
        logger.error("Firebase user creation error:", error);
        throw boom.internal("Failed to create user in Firebase");
      }

      // 3. Create the business user with is_password_created set to false
      const newUser = await authService.createBusinessUser(
        user,
        newBusiness.id,
        firebaseUser.uid,
        trx
      );

      // 4. Create or get admin role
      const adminRole = await authService.getOrCreateAdminRole(
        newBusiness.id,
        trx
      );

      // 5. Assign admin role to the user
      await authService.assignRoleToUser(newUser, adminRole.id, trx);

      // 6. Generate password reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 24); // 24 hour expiry for initial setup

      // 7. Update user with reset token
      await authService.updateUserWithResetToken(
        newUser.id,
        newUser,
        resetToken,
        resetTokenExpiry,
        trx
      );

      // Commit the transaction
      await trx.commit();

      // 8. Send password setup email
      await emailService.sendEmail({
        to: user.email,
        subject: "Complete Your JustPing Registration",
        templateName: "welcome", // Using the password reset template
        variables: {
          user_name: `${user.first_name} ${user.last_name}`,
          reset_link: `${process.env.FRONTEND_URL}/set-password?token=${resetToken}`,
        },
      });

      //TODO: remove console.log in production
      console.log("resetToken:", resetToken);
      return {
        success: true,
        message:
          "Business and user registered successfully. Check email to set password.",
        data: {
          businessId: newBusiness.id,
          userId: newUser.id,
        },
      };
    } catch (error) {
      // Rollback transaction on error
      await trx.rollback();
      throw error;
    }
  } catch (error) {
    logger.error("Registration error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to register business and user");
  }
};

/**
 * Login user with email and password
 * @param {Object} credentials - Login credentials
 * @returns {Promise<Object>} Login result with tokens
 */
const loginUser = async (credentials) => {
  try {
    // Firebase authentication
    const firebaseAuth = await authService.authenticateWithFirebase(
      credentials.email,
      credentials.password
    );

    // Get user with roles and permissions
    const user = await authService.getUserWithRolesAndPermissions(
      credentials.email
    );
    if (!user) {
      throw boom.notFound("User not found");
    }

    // Check if user is active
    if (user.status !== "active") {
      throw boom.forbidden("Account is not active");
    }

    // Generate JWT with enhanced role information
    const tokens = authUtils.generateJWT(
      user,
      user.roles,
      user.combinedPermissions
    );

    return {
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          businessId: user.business_id,
          status: user.status,
          isOnboarded: user.is_onboarded,
          roles: user.roles.map((role) => ({
            id: role.id,
            name: role.name,
            description: role.description,
          })),
          permissions: user.combinedPermissions,
        },
        ...tokens,
      },
    };
  } catch (error) {
    logger.error("User login error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.unauthorized("Invalid credentials");
  }
};

/**
 * Request password reset
 * @param {Object} data - Password reset request data
 * @returns {Promise<Object>} Request result
 */
const requestPasswordReset = async (data) => {
  try {
    const result = await authService.createPasswordResetToken(data.email);

    if (result.success) {
      await emailService.sendEmail({
        to: data.email,
        subject: "Reset Your Password",
        templateName: "password-reset",
        variables: {
          resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${result.token}`,
          year: new Date().getFullYear(),
        },
      });
    }

    // Always return success to prevent email enumeration
    return {
      success: true,
      message:
        "If your email is registered, you will receive reset instructions",
    };
  } catch (error) {
    logger.error("Password reset request error:", error);
    if (error.isBoom) {
      throw error;
    }
    // Always return success to prevent email enumeration
    return {
      success: true,
      message:
        "If your email is registered, you will receive reset instructions",
    };
  }
};

/**
 * Reset password with token
 * @param {Object} data - Password reset data
 * @returns {Promise<Object>} Reset result
 */
const resetPassword = async (data) => {
  try {
    // Validate password
    const passwordValidation = authUtils.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      throw boom.badRequest(passwordValidation.errors.join(", "));
    }

    console.log("token:", data.token);
    // Find user with this reset token
    const user = await authService.findUserByResetToken(data.token);
    if (!user) {
      throw boom.notFound("Invalid or expired reset token");
    }

    // Check if token is expired
    const tokenExpiry = new Date(user.metadata.resetTokenExpiry);
    if (tokenExpiry < new Date()) {
      throw boom.badRequest("Reset token has expired");
    }

    // Update password in Firebase
    await authService.updateFirebaseUserPassword(
      user.firebase_uid,
      data.password
    );

    // Update user in our database

    await authService.updateUserMetadata(user.id, {
      ...user.metadata,
      resetToken: null,
      resetTokenExpiry: null,
      tokenVersion: (user.metadata.tokenVersion || 0) + 1,
    });

    return {
      success: true,
      message: "Password reset successful",
    };
  } catch (error) {
    logger.error("Password reset error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to reset password");
  }
};

/**
 * Refresh access token using refresh token
 * @param {Object} data - Refresh token data
 * @returns {Promise<Object>} New tokens
 */
const refreshToken = async (data) => {
  try {
    // Verify refresh token
    const decoded = await authService.verifyJwtToken(data.refreshToken);

    // Check if it's a refresh token
    if (decoded.type !== "refresh") {
      throw boom.unauthorized("Invalid token type");
    }

    // Get user
    const user = await authService.getUserById(decoded.userId);
    if (!user) {
      throw boom.unauthorized("User not found");
    }

    // Check token version to prevent use of revoked tokens
    if ((user.metadata?.tokenVersion || 0) !== decoded.tokenVersion) {
      throw boom.unauthorized("Token has been revoked");
    }

    // Get user roles
    const roles = await authService.getUserRoles(user.id);

    // Extract permissions from roles
    const permissions = {};
    roles.forEach((role) => {
      if (role.permissions) {
        Object.assign(permissions, role.permissions);
      }
    });

    // Generate new tokens
    const tokens = authUtils.generateJWT(user, roles, permissions);

    return {
      success: true,
      message: "Token refreshed successfully",
      data: tokens,
    };
  } catch (error) {
    logger.error("Token refresh error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.unauthorized("Invalid refresh token");
  }
};

/**
 * Get current user profile
 * @param {Object} user - Authenticated user
 * @returns {Promise<Object>} User profile
 */
const getCurrentUser = async (user) => {
  try {
    const userProfile = await authService.getUserById(user.userId);

    if (!userProfile) {
      throw boom.notFound("User not found");
    }

    const roles = await authService.getUserRoles(user.userId);

    // Extract permissions from roles
    const permissions = {};
    roles.forEach((role) => {
      if (role.permissions) {
        Object.assign(permissions, role.permissions);
      }
    });

    return {
      success: true,
      data: {
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        businessId: userProfile.business_id,
        roles: roles.map((role) => ({
          id: role.id,
          name: role.name,
          description: role.description,
        })),
        permissions,
      },
    };
  } catch (error) {
    logger.error("Get current user error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to retrieve user profile");
  }
};

/**
 * Logout user
 * @param {string} token - Access token to blacklist
 * @returns {Promise<Object>} Logout result
 */
const logoutUser = async (token) => {
  try {
    // Verify token to get expiry (ignoring if it's already expired)
    const decoded = await authService.verifyJwtToken(token, true);

    // Calculate expiry date
    const expiryDate = new Date(decoded.exp * 1000);

    // Add to blacklist
    await authService.blacklistToken(token, expiryDate);

    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (error) {
    logger.error("Logout error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to logout");
  }
};

/**
 * Change user password
 * @param {Object} data - Password change data
 * @param {Object} user - Authenticated user
 * @returns {Promise<Object>} Change result
 */
const changePassword = async (data, user) => {
  try {
    // Validate new password
    const passwordValidation = authUtils.validatePassword(data.newPassword);
    if (!passwordValidation.isValid) {
      throw boom.badRequest(passwordValidation.errors.join(", "));
    }

    // Get user from database
    const userRecord = await authService.getUserById(user.userId);
    if (!userRecord) {
      throw boom.notFound("User not found");
    }

    try {
      // Verify current password with Firebase
      await authService.authenticateWithFirebase(
        userRecord.email,
        data.currentPassword
      );
    } catch (error) {
      throw boom.unauthorized("Current password is incorrect");
    }

    // Update password in Firebase

    await authService.updateFirebaseUserPassword(
      userRecord.firebase_uid,
      data.newPassword
    );

    // Increment token version to invalidate all existing refresh tokens

    await authService.updateUserMetadata(user.userId, {
      ...userRecord.metadata,
      tokenVersion: (userRecord.metadata?.tokenVersion || 0) + 1,
    });

    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error) {
    logger.error("Password change error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to change password");
  }
};

module.exports = {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  refreshToken,
  getCurrentUser,
  logoutUser,
  changePassword,
};