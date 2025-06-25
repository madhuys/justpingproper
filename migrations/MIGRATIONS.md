# Knex Migrations Guide

This document explains how to work with our Knex-based database migration system and how it integrates with our application.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Setup](#setup)
  - [Creating Migrations](#creating-migrations)
  - [Writing Migrations](#writing-migrations)
- [Working with Migrations](#working-with-migrations)
  - [Checking Migration Status](#checking-migration-status)
  - [Running Migrations Manually](#running-migrations-manually)
  - [Rolling Back Migrations](#rolling-back-migrations)
- [Automated Migrations](#automated-migrations)
  - [How Auto-Migrations Work](#how-auto-migrations-work)
  - [Configuration](#configuration)
  - [Local Development Setup](#local-development-setup)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

We use Knex.js migrations to manage our database schema changes in a controlled, versioned way. Each migration file defines both the changes to apply (`up`) and how to revert them (`down`). This system ensures that:

- All developers work with the same database schema
- Changes are applied in a consistent order across environments
- Database schema evolution is tracked in version control
- Deployments can automatically update the database schema

## Getting Started

### Setup

Before you can create or run migrations, ensure you have:

1. Cloned the repository
2. Installed dependencies with `npm install`
3. Set up your local environment variables (copy `local.env.example` to `local.env` and adjust as needed)
4. Ensured you have PostgreSQL running and accessible with the credentials in your `.env` file

### Creating Migrations

To create a new migration:

```bash
# Format: node migrations/cli.js create <migration_name>
node migrations/cli.js create add_user_roles
```

This will create a new JS file in the `migrations/knex` directory with a timestamp prefix, such as:
`20250402123456_add_user_roles.js`

### Writing Migrations

Edit the created JS file to define your schema changes. Each migration file exports two functions:

- `up` - Applies the changes
- `down` - Reverts the changes

Example migration:

```javascript
exports.up = function (knex) {
  return knex.schema.createTable("roles", (table) => {
    table.increments("id").primary();
    table.string("name", 50).notNullable().unique();
    table.text("description");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("roles");
};
```

Knex provides a rich API for schema modifications. Some common operations:

```javascript
// Create a table
knex.schema.createTable("table_name", (table) => {
  table.increments("id");
  table.string("name");
  table.uuid("uuid_field").defaultTo(knex.raw("uuid_generate_v4()"));
  table.text("description");
  table.boolean("is_active").defaultTo(true);
  table.timestamp("created_at").defaultTo(knex.fn.now());
  table.jsonb("settings");

  // Foreign key
  table
    .uuid("parent_id")
    .references("id")
    .inTable("parent_table")
    .onDelete("CASCADE");

  // Compound unique constraint
  table.unique(["field1", "field2"]);
});

// Modify an existing table
knex.schema.alterTable("table_name", (table) => {
  table.string("new_field");
  table.dropColumn("old_field");
});

// Raw SQL for complex operations
knex.raw("CREATE INDEX idx_field ON table_name (field)");
```

## Working with Migrations

### Checking Migration Status

To see which migrations have been applied and which are pending:

```bash
node migrations/cli.js status
```

This will show output like:

```
Migration Status:
=================
Completed migrations:
  ✓ 20250325000001_auth_schema.js
  ✓ 20250325000002_token_blacklist.js

Pending migrations:
  ⨯ 20250402123456_add_user_roles.js

Summary:
- Total migrations: 3
- Applied: 2
- Pending: 1
```

### Running Migrations Manually

To run all pending migrations:

```bash
node migrations/cli.js up
```

This will apply all pending migrations in sequence and show output like:

```
Running pending migrations...
Batch 2 run: 1 migrations

Applied migrations:
  → 20250402123456_add_user_roles.js
```

### Rolling Back Migrations

To roll back the most recent migration:

```bash
node migrations/cli.js down
```

To roll back multiple migrations:

```bash
node migrations/cli.js down 3  # Rolls back 3 most recent migrations
```

## Automated Migrations

Our application supports automatically running migrations during startup, which is particularly useful in development environments.

### How Auto-Migrations Work

When the application starts:

1. It checks if auto-migration is enabled for the current environment
2. If enabled, it runs any pending migrations before starting the server
3. All migrations are logged so you can see what was applied

This means you generally don't need to run migrations manually during development - they'll be applied automatically when you start the server.

### Configuration

Auto-migrations are configured in `system/config/config.js`:

```javascript
migrations: {
  // Whether to auto-run migrations on app startup
  autoRun: process.env.AUTO_RUN_MIGRATIONS === "true" || false,
  // Only allow migration auto-run in specific environments
  autoRunEnvironments: ["development", "dev", "local", "test"],
}
```

You can control this behavior with the `AUTO_RUN_MIGRATIONS` environment variable in your `.env` file:

```
# Enable auto-running migrations on startup
AUTO_RUN_MIGRATIONS=true
```

### Local Development Setup

For local development, we recommend:

1. Set `AUTO_RUN_MIGRATIONS=true` in your local environment file
2. Start the server with `npm start`
3. Migrations will run automatically, and you'll see logs like:

```
[INFO] Auto-running database migrations...
[INFO] Migration completed. Applied 1 of 1 migrations.
[INFO] Server listening on port 8080
```

If you create a new migration while the server is running, you'll need to restart the server for it to be applied automatically.

## Best Practices

1. **One change per migration**: Keep migrations focused on a single change when possible
2. **Test migrations**: Always test your migrations on a staging environment first
3. **Version control**: Always commit migration files to version control
4. **Use transactions**: Knex wraps migrations in transactions by default; be careful with operations that can't be in transactions
5. **Incremental changes**: Prefer small, incremental changes over large schema rewrites
6. **Include down migrations**: Always implement the `down` function to allow rollbacks
7. **Write production-safe migrations**: Ensure migrations can run safely in production (e.g., adding columns with defaults rather than requiring values)

## Troubleshooting

### Common Issues

#### Migration fails with "column X already exists"

This usually means that the migration was partially applied before. You can either:

- Modify the migration to use `createTableIfNotExists` or add `if not exists` checks
- Roll back the previous attempt and try again

#### Auto-migrations not running

Check:

1. Is `AUTO_RUN_MIGRATIONS` set to `true` in your `.env` file?
2. Is your current environment in the `autoRunEnvironments` list?
3. Check the application logs for any migration-related errors

#### Knex migration table conflicts with existing database

If you were using the old migration system and have switched to Knex, you might have conflicts. You can:

1. Manually record your existing migrations in the `knex_migrations` table
2. Or rename your new migrations to have newer timestamps

### Getting Help

If you encounter issues with migrations that you can't resolve, contact the database administrator or lead developer.
