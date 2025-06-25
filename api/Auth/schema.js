const Joi = require("joi");

// Registration schema
const registerSchema = Joi.object({
  business: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
    website: Joi.string().uri().allow(null, ""),
    industry: Joi.string().allow(null, ""),
    contact_info: Joi.object({
      phone: Joi.string(),
      address: Joi.string(),
      // Add other contact fields as needed
    }).allow(null),
  }).required(),

  user: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
  }).required(),
});

// Login schema
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Refresh token schema
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// Password reset request schema
const passwordResetRequestSchema = Joi.object({
  email: Joi.string().email().required(),
});

// Password reset schema
const passwordResetSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({ "any.only": "Passwords must match" }),
});

// Update user schema
const updateUserSchema = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  metadata: Joi.object(),
}).min(1);

// Change password schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({ "any.only": "Passwords must match" }),
});

const roleAssignmentSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  roleId: Joi.string().uuid().required(),
});

const userRoleUpdateSchema = Joi.object({
  roles: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  updateUserSchema,
  changePasswordSchema,
  roleAssignmentSchema,
  userRoleUpdateSchema,
};
