/**
 * Migration Utilities for PostgreSQL
 *
 * Helper functions for managing database migrations
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { query, getClient } = require("../../system/db/postgres");
const logger = require("../../system/utils/logger");
const config = require("../../system/config/config");

// Constants
const MIGRATIONS_TABLE = "migrations";
const SQL_DIRECTORY = path.join(__dirname, "../sql");

/**
 * Initialize the migrations table
 * @returns {Promise<void>}
 */
const initMigrationsTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
        checksum VARCHAR(64),
        execution_time INTEGER,
        success BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);

    logger.info(`Migrations table '${MIGRATIONS_TABLE}' initialized`);
  } catch (err) {
    logger.error("Failed to initialize migrations table:", err);
    throw err;
  }
};

/**
 * Get all migration files from the migrations directory
 * @returns {string[]} Array of migration filenames
 */
const getAllMigrationFiles = () => {
  return fs
    .readdirSync(SQL_DIRECTORY)
    .filter((file) => file.endsWith(".sql"))
    .sort();
};

/**
 * Generate a checksum for a migration file
 * @param {string} filename - Migration filename
 * @returns {string} MD5 checksum of the file
 */
const generateChecksum = (filename) => {
  const filePath = path.join(SQL_DIRECTORY, filename);
  const fileContent = fs.readFileSync(filePath, "utf8");
  return crypto.createHash("md5").update(fileContent).digest("hex");
};

/**
 * Get all applied migrations from the database
 * @returns {Promise<Array>} Array of applied migrations
 */
const getAppliedMigrations = async () => {
  try {
    const { rows } = await query(
      `SELECT name, applied_at, checksum, execution_time 
       FROM ${MIGRATIONS_TABLE} 
       WHERE success = TRUE 
       ORDER BY id`
    );
    return rows;
  } catch (err) {
    logger.error("Failed to get applied migrations:", err);
    throw err;
  }
};

/**
 * Get pending migrations that haven't been applied yet
 * @returns {Promise<string[]>} Array of pending migration filenames
 */
const getPendingMigrations = async () => {
  const appliedMigrations = await getAppliedMigrations();
  const appliedNames = appliedMigrations.map((m) => m.name);

  const allMigrationFiles = getAllMigrationFiles();
  return allMigrationFiles.filter((file) => !appliedNames.includes(file));
};

/**
 * Get detailed migration status
 * @returns {Promise<Array>} Array of migration status objects
 */
const getMigrationStatus = async () => {
  await initMigrationsTable();

  const appliedMigrations = await getAppliedMigrations();
  const allMigrationFiles = getAllMigrationFiles();

  return allMigrationFiles.map((file) => {
    const applied = appliedMigrations.find((m) => m.name === file);
    const currentChecksum = generateChecksum(file);

    return {
      name: file,
      status: applied ? "APPLIED" : "PENDING",
      applied_at: applied ? applied.applied_at : null,
      checksum_match: applied ? applied.checksum === currentChecksum : null,
      changed: applied ? applied.checksum !== currentChecksum : false,
    };
  });
};

/**
 * Run all pending migrations
 * @returns {Promise<Object>} Migration run results
 */
const runMigrations = async () => {
  await initMigrationsTable();

  const pendingMigrations = await getPendingMigrations();
  const results = {
    total: pendingMigrations.length,
    successful: 0,
    failed: 0,
    details: [],
  };

  if (pendingMigrations.length === 0) {
    logger.info("No pending migrations to run");
    return results;
  }

  logger.info(`Found ${pendingMigrations.length} pending migrations`);

  for (const file of pendingMigrations) {
    const client = await getClient();
    const startTime = Date.now();
    const migrationResult = {
      name: file,
      success: false,
      executionTime: 0,
    };

    try {
      logger.info(`Running migration: ${file}`);

      const filePath = path.join(SQL_DIRECTORY, file);
      const sql = fs.readFileSync(filePath, "utf8");
      const checksum = generateChecksum(file);

      await client.query("BEGIN");

      // Execute the SQL migration
      await client.query(sql);

      const executionTime = Date.now() - startTime;

      // Record the migration
      await client.query(
        `INSERT INTO ${MIGRATIONS_TABLE} (name, checksum, execution_time) VALUES ($1, $2, $3)`,
        [file, checksum, executionTime]
      );

      await client.query("COMMIT");

      migrationResult.success = true;
      migrationResult.executionTime = executionTime;
      results.successful++;

      logger.info(
        `Migration ${file} completed successfully in ${executionTime}ms`
      );
    } catch (err) {
      await client.query("ROLLBACK");
      logger.error(`Migration ${file} failed:`, err);

      migrationResult.error = err.message;
      results.failed++;

      // Record the failed migration
      try {
        await query(
          `INSERT INTO ${MIGRATIONS_TABLE} (name, success, execution_time) VALUES ($1, $2, $3)`,
          [file, false, Date.now() - startTime]
        );
      } catch (recordErr) {
        logger.error("Failed to record migration failure:", recordErr);
      }

      // Stop running migrations on failure
      break;
    } finally {
      client.release();
      results.details.push(migrationResult);
    }
  }

  return results;
};

/**
 * Format data as a text table for console output
 * @param {Array} data - Array of objects to display in the table
 * @param {Array} columns - Array of column definitions with keys and labels
 * @returns {string} Formatted table string
 */
const formatTable = (data, columns) => {
  if (!data || data.length === 0) return "No data";

  // Calculate column widths
  const widths = {};
  columns.forEach((col) => {
    widths[col.key] = Math.max(
      col.label.length,
      ...data.map((row) => {
        const value = row[col.key] !== undefined ? row[col.key] : "";
        return String(value).length;
      })
    );
  });

  // Build header
  let table = "";
  table +=
    columns.map((col) => col.label.padEnd(widths[col.key])).join(" | ") + "\n";
  table += columns.map((col) => "-".repeat(widths[col.key])).join("-+-") + "\n";

  // Build rows
  table += data
    .map((row) =>
      columns
        .map((col) => {
          const value = row[col.key] !== undefined ? row[col.key] : "";
          return String(value).padEnd(widths[col.key]);
        })
        .join(" | ")
    )
    .join("\n");

  return table;
};

/**
 * Create a new migration file
 * @param {string} name - Name of the migration
 * @returns {string} Path to the created migration file
 */
const createMigrationFile = (name) => {
  if (!name) {
    throw new Error("Migration name is required");
  }

  // Sanitize name - remove special characters and convert to snake_case
  const sanitizedName = name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_{2,}/g, "_");

  // Format: YYYYMMDDHHMMSS_name.sql
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  const fileName = `${timestamp}_${sanitizedName}.sql`;
  const filePath = path.join(SQL_DIRECTORY, fileName);

  // Migration template
  const template = `-- Migration: ${sanitizedName}
-- Created at: ${new Date().toISOString()}

-- Up Migration

-- Add your migration SQL here
-- Example:
-- CREATE TABLE users (
--   id SERIAL PRIMARY KEY,
--   username VARCHAR(100) NOT NULL UNIQUE,
--   email VARCHAR(255) NOT NULL UNIQUE,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

`;

  fs.writeFileSync(filePath, template);
  logger.info(`Created migration: ${fileName}`);

  return filePath;
};

module.exports = {
  initMigrationsTable,
  getAllMigrationFiles,
  getAppliedMigrations,
  getPendingMigrations,
  getMigrationStatus,
  runMigrations,
  formatTable,
  createMigrationFile,
};
