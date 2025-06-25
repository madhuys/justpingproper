// system/db/database.js
const Knex = require("knex");
const { Model } = require("objection");
const knexConfig = require("../../knexfile");
const logger = require("../utils/logger");

// Initialize knex
const knex = Knex({
  ...knexConfig,
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    acquireTimeoutMillis: 30000,
  },
});

// Bind all Models to the knex instance
Model.knex(knex);

// Test the connection
knex
  .raw("SELECT 1")
  .then(() => {
    logger.info("Connected to PostgreSQL database via Knex/Objection.js");
  })
  .catch((err) => {
    logger.error("PostgreSQL connection error via Knex/Objection.js:", err);
  });

// Add this function for Objection.js transactions
const transaction = async (callback) => {
  return Model.transaction(callback);
};

module.exports = {
  knex,
  Model,
  transaction,
};
