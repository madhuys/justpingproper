const boom = require("@hapi/boom");

// eslint-disable-next-line consistent-return
const controllerHandler = (promise, params) => async (req, res, next) => {
  const boundParams = params ? params(req, res, next) : [];
  try {
    const result = await promise(...boundParams);

    // If response already sent (e.g., in webhook middleware), don't send again
    if (req.skipResponse || res.headersSent) {
      return;
    }

    // Check if the result contains a statusCode property
    const statusCode = result && result.statusCode ? result.statusCode : 200;

    // Remove statusCode from the response if it exists
    if (result && result.statusCode) {
      delete result.statusCode;
    }

    return res.status(statusCode).json(
      result || {
        message: "OK",
      },
    );
  } catch (error) {
    if (!error.isBoom) {
      return next(boom.badImplementation(error));
    }
    // Pass the original Boom error to next
    next(error);
  }
};

module.exports = controllerHandler;
