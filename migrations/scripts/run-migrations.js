/**
 * Knex Migration Runner Script
 *
 * Run this script to apply pending migrations programmatically
 * (for use in deployment scripts or application startup)
 */

// Make sure environment variables are loaded
if (process.env.NODE_ENV === "local" || process.env.NODE_ENV === "dev") {
  require("dotenv").config({
    path: `./${process.env.NODE_ENV}.env`,
  });
}

const { knex } = require("../../system/db/database");
const logger = require("../../system/utils/logger");

/**
 * Run all pending migrations
 * @returns {Promise<Object>} Migration results
 */
const runMigrations = async () => {
  try {
    logger.info("Running database migrations...");

    // Run migrations and get results
    const [batchNo, migrations] = await knex.migrate.latest();

    const results = {
      total: migrations.length,
      successful: migrations.length,
      failed: 0,
      details: migrations.map((name) => ({
        name,
        success: true,
        executionTime: 0, // Knex doesn't provide this natively
      })),
    };

    logger.info(
      `Migration completed. Applied ${results.successful} of ${results.total} migrations.`
    );

    return results;
  } catch (err) {
    logger.error("Failed to run migrations:", err);
    throw err;
  }
};

// Run the migrations when the script is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info("Migration script completed");
      knex.destroy().then(() => process.exit(0));
    })
    .catch((err) => {
      logger.error("Migration script failed:", err);
      knex.destroy().then(() => process.exit(1));
    });
}

module.exports = runMigrations;
