const Joi = require("joi");

// Schema for creating a new role
const createRoleSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().allow(null, ""),
  permissions: Joi.object()
    .required()
    .pattern(
      // Key pattern (module name)
      Joi.string().min(1).max(50),
      // Value pattern (permission flags)
      Joi.object().pattern(
        // Action name (create, read, update, delete)
        Joi.string().valid("create", "read", "update", "delete"),
        // Boolean value
        Joi.boolean()
      )
    ),
});

// Schema for updating an existing role
const updateRoleSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().allow(null, ""),
  permissions: Joi.object().pattern(
    // Key pattern (module name)
    Joi.string().min(1).max(50),
    // Value pattern (permission flags)
    Joi.object().pattern(
      // Action name (create, read, update, delete)
      Joi.string().valid("create", "read", "update", "delete"),
      // Boolean value
      Joi.boolean()
    )
  ),
}).min(1); // At least one field must be provided

// Schema for assigning a role to a user
const assignRoleSchema = Joi.object({
  roleId: Joi.string().uuid().required(),
});

// Schema for updating all roles for a user
const updateUserRolesSchema = Joi.object({
  roleIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

module.exports = {
  createRoleSchema,
  updateRoleSchema,
  assignRoleSchema,
  updateUserRolesSchema,
};
