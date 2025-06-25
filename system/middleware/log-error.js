const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
    logger.debug(`request header: ${JSON.stringify(req.headers)}`);
    logger.debug(`request body: ${JSON.stringify(req.original_body)}`);
    logger.debug(err.stack);
    next(err);
};
