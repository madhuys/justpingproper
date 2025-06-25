#!/usr/bin/env node

/**
 * Script to run the Contact Upload Worker
 *
 * This script can be run directly or added as a process in PM2:
 *
 * npm run contact-worker
 *
 * or
 *
 * pm2 start scripts/run-contact-worker.js --name "contact-worker"
 */
const dotenv = require("dotenv");

console.log("Loading environment variables...", process.env.NODE_ENV);
switch (process.env.NODE_ENV) {
  case "production":
    dotenv.config({ path: "./production.env" });
    break;
  case "staging":
    dotenv.config({ path: "./staging.env" });
    break;
  case "development":
    dotenv.config({ path: "./dev.env" });
    break;
  default:
    dotenv.config({ path: "./.env.local" }); // Default to local environment
    break;
}

const { worker } = require("./api/Contacts/workers/contactUploadWorker");
const logger = require("./system/utils/logger");

logger.info("Starting Contact Upload Worker...");

worker().catch((error) => {
  logger.error(`Fatal error in Contact Upload Worker: ${error.message}`, error);
  process.exit(1);
});
