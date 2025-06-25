/**
 * Migration to add enable_ai_takeover column to agent_nodes table
 * This column is required for the AI takeover functionality
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Check if the column already exists
  const hasColumn = await knex.schema.hasColumn(
    "agent_nodes",
    "enable_ai_takeover",
  );

  if (!hasColumn) {
    return knex.schema.alterTable("agent_nodes", function (table) {
      // Add enable_ai_takeover column for AI takeover functionality
      table.boolean("enable_ai_takeover").defaultTo(false).notNullable();

      // Add index for performance when querying AI-enabled steps
      table.index("enable_ai_takeover");

      // Add composite index for efficient lookups
      table.index(["agent_id", "enable_ai_takeover"]);
    });
  } else {
    console.log(
      "Column 'enable_ai_takeover' already exists in agent_nodes table",
    );
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("agent_nodes", function (table) {
    // Drop indexes first
    table.dropIndex("enable_ai_takeover");
    table.dropIndex(["agent_id", "enable_ai_takeover"]);

    // Drop the column
    table.dropColumn("enable_ai_takeover");
  });
};
