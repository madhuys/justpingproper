const boom = require("@hapi/boom");
const logger = require("../utils/logger");

// Validate request against Joi schema
const validateRequest = (schema) => {
  return (req, res, next) => {
    const errors = [];

    // Validate params if schema has params
    if (schema.params) {
      const { error } = schema.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(...error.details);
      }
    }

    // Validate query if schema has query
    if (schema.query) {
      const { error } = schema.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(...error.details);
      }
    }

    // Validate body if schema has body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(...error.details);
      }
    }

    // If schema is not an object with specific parts, validate body directly
    if (!schema.params && !schema.query && !schema.body) {
      const { error } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(...error.details);
      }
    }

    if (errors.length > 0) {
      // Log the error for debugging purposes
      logger.error(
        `Validation error: ${errors.map((e) => e.message).join(", ")}`,
      );
      // Format validation errors
      const details = {};

      errors.forEach((detail) => {
        const key = detail.path[0];
        if (!details[key]) {
          details[key] = [];
        }
        details[key].push(detail.message);
      });

      return next(boom.badRequest("Validation failed", { details }));
    }

    next();
  };
};

module.exports = {
  validateRequest,
};
