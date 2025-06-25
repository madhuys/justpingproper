const { Pool } = require("pg");
const logger = require("../utils/logger");
const { getDbConfig } = require("../config/database");

// Get database configuration
const dbConfig = getDbConfig();

// Create a connection pool
const pool = new Pool({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000, // Increased to 10 seconds for Azure connections
  statement_timeout: 30000, // 30 seconds for query execution
  query_timeout: 30000, // 30 seconds for query timeout
  keepAlive: true, // Keep connections alive
  ssl: dbConfig.ssl,
});

// Test the connection
pool.on("connect", () => {
  logger.info("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  logger.error("PostgreSQL connection error:", err);
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  let retries = 3;

  while (retries > 0) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug("Executed query", { text, duration, rows: res.rowCount });
      return res;
    } catch (err) {
      retries--;

      // Check if it's a connection error that we can retry
      const isRetryableError =
        err.message.includes("Connection terminated") ||
        err.message.includes("connection timeout") ||
        err.message.includes("ECONNRESET") ||
        err.message.includes("ENOTFOUND") ||
        err.code === "ECONNRESET" ||
        err.code === "ENOTFOUND" ||
        err.code === "ETIMEDOUT";

      if (retries > 0 && isRetryableError) {
        logger.warn(
          `Database connection error, retrying... (${retries} retries left)`,
          {
            error: err.message,
            text: text.substring(0, 100),
          },
        );

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, (4 - retries) * 1000),
        );
        continue;
      }

      logger.error("Error executing query", { text, error: err.message });
      throw err;
    }
  }
};

// Helper function for transactions
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const getClient = async () => {
  return await pool.connect();
};

// Health check function
const healthCheck = async () => {
  try {
    const result = await query("SELECT 1 as healthy");
    return { healthy: true, message: "Database connection successful" };
  } catch (error) {
    logger.error("Database health check failed:", error);
    return { healthy: false, message: error.message };
  }
};

// Add this function to the exports
const objectionTransaction = async (callback) => {
  const { Model } = require("objection");
  return Model.transaction(callback);
};

module.exports = {
  query,
  transaction,
  pool,
  getClient,
  objectionTransaction,
  healthCheck,
};
