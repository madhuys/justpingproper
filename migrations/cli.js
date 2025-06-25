// migrations/cli.js

/**
 * Knex Migration CLI tool
 *
 * Command-line interface for Knex migrations
 *
 * Usage:
 *   node migrations/cli.js status
 *   node migrations/cli.js up
 *   node migrations/cli.js create <migration_name>
 */

// Make sure environment variables are loaded
if (process.env.NODE_ENV === "local" || process.env.NODE_ENV === "dev") {
  require("dotenv").config({
    path: `./${process.env.NODE_ENV}.env`,
  });
}

const path = require("path");
const knex = require("../system/db/database").knex;
const logger = require("../system/utils/logger");

// Display banner
const displayBanner = () => {
  console.log("Knex Migration Tool");
  console.log("==================");
  console.log("");
};

// Display help
const displayHelp = () => {
  console.log("Available commands:");
  console.log("  status             Show migration status");
  console.log("  up                 Run pending migrations");
  console.log(
    "  down [count]       Rollback last migration or [count] migrations"
  );
  console.log("  create <name>      Create a new migration file");
  console.log("");
  console.log("Examples:");
  console.log("  node migrations/cli.js status");
  console.log("  node migrations/cli.js up");
  console.log("  node migrations/cli.js down 2");
  console.log("  node migrations/cli.js create add_users_table");
};

// Handle commands
const main = async () => {
  displayBanner();

  const command = process.argv[2];

  if (!command) {
    displayHelp();
    process.exit(0);
  }

  try {
    switch (command) {
      case "status":
        // Get completed and pending migrations
        const completed = await knex.migrate.list();

        console.log("Migration Status:");
        console.log("=================");
        console.log("Completed migrations:");
        if (completed[0].length === 0) {
          console.log("  No completed migrations");
        } else {
          completed[0].forEach((migration) => {
            console.log(`  ✓ ${migration}`);
          });
        }

        console.log("\nPending migrations:");
        if (completed[1].length === 0) {
          console.log("  No pending migrations");
        } else {
          completed[1].forEach((migration) => {
            console.log(`  ⨯ ${migration}`);
          });
        }

        // Summary
        console.log("\nSummary:");
        console.log(
          `- Total migrations: ${completed[0].length + completed[1].length}`
        );
        console.log(`- Applied: ${completed[0].length}`);
        console.log(`- Pending: ${completed[1].length}`);
        break;

      case "up":
        console.log("Running pending migrations...");
        const result = await knex.migrate.latest();

        console.log(`Batch ${result[0]} run: ${result[1].length} migrations`);
        if (result[1].length > 0) {
          console.log("\nApplied migrations:");
          result[1].forEach((migration) => {
            console.log(`  → ${migration}`);
          });
        } else {
          console.log("No migrations to run - already up to date");
        }
        break;

      case "down":
        const count = process.argv[3] ? parseInt(process.argv[3]) : 1;
        console.log(`Rolling back ${count} migration(s)...`);

        const rollbackResult = await knex.migrate.rollback({}, count);

        console.log(
          `Batch ${rollbackResult[0]} rolled back: ${rollbackResult[1].length} migrations`
        );
        if (rollbackResult[1].length > 0) {
          console.log("\nRolled back migrations:");
          rollbackResult[1].forEach((migration) => {
            console.log(`  → ${migration}`);
          });
        } else {
          console.log("No migrations to roll back");
        }
        break;

      case "create":
        const migrationName = process.argv[3];
        if (!migrationName) {
          console.error("Please provide a migration name");
          console.log("Usage: node migrations/cli.js create <migration_name>");
          process.exit(1);
        }

        const directory = path.join(__dirname, "knex");
        const options = { directory };

        await knex.migrate.make(migrationName, options);
        console.log(`Created migration: ${migrationName}`);
        break;

      case "help":
        displayHelp();
        break;

      default:
        console.log(`Unknown command: ${command}`);
        displayHelp();
        process.exit(1);
    }
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    // Close database connections
    await knex.destroy();
  }
};

// Run the CLI
main();
