// api/TeamInbox/index.js
const router = require("./route");
const controller = require("./controller");
const service = require("./service");
const repository = require("./repository");

/**
 * TeamInbox module exports
 *
 * Exposes router and service components for the TeamInbox feature
 */
module.exports = {
  router,
  controller,
  service,
  repository,
};
