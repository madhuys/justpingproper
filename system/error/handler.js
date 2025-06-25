/* eslint-disable no-unused-vars */
const boom = require("@hapi/boom");
const validationErrorHandler = require("celebrate").errors;

async function tokenErrorHandler(err, req, res, next) {
  if (err.status === 401) {
    next(boom.unauthorized(err.name));
  } else {
    next(err);
  }
}

function allErrorHandler(err, req, res, next) {
  // Don't try to send response if headers already sent
  if (res.headersSent) {
    return;
  }

  if (err.output) {
    return res.status(err.output.statusCode).json(err.output.payload);
  }
  return res.status(500).json("Internal Server Error");
}

const { isCelebrateError } = require("celebrate");

function errorHandler(err, req, res, next) {
  // Handle celebrate validation errors
  if (isCelebrateError(err)) {
    const validationErrors = {};

    for (const [segment, joiError] of err.details.entries()) {
      validationErrors[segment] = {
        keys: [],
        message: [],
      };

      joiError.details.forEach((detail) => {
        validationErrors[segment].keys.push(detail.path[0]);
        validationErrors[segment].message.push(detail.message);
      });
    }

    return res.status(400).json({
      statusCode: 400,
      error: "Bad Request",
      message: Object.values(validationErrors)[0].message[0],
      validation: {
        source: Object.keys(validationErrors)[0],
        keys: Object.values(validationErrors)[0].keys,
      },
    });
  }

  // Handle other errors
  const status = err.statusCode || 500;
  const error = {
    statusCode: status,
    error: err.name || "Internal Server Error",
    message: err.message || "An unexpected error occurred",
  };

  return res.status(status).json(error);
}

module.exports = {
  token: tokenErrorHandler,
  validation: validationErrorHandler(),
  all: allErrorHandler,
  errorHandler,
};
