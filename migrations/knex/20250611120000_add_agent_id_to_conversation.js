/**
 * Migration to add agent_id column to conversation table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("conversation", function (table) {
    // Add agent_id column for tracking which agent is handling the conversation
    table
      .uuid("agent_id")
      .nullable()
      .references("id")
      .inTable("agents")
      .onDelete("SET NULL");

    // Add metadata column if it doesn't exist for storing captured variables
    table.jsonb("metadata").nullable().defaultTo("{}");

    // Add indexes for performance
    table.index("agent_id");
    table.index(["end_user_id", "business_channel_id", "agent_id"]);
    table.index(["business_channel_id", "status"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("conversation", function (table) {
    // Drop indexes first
    table.dropIndex("agent_id");
    table.dropIndex(["end_user_id", "business_channel_id", "agent_id"]);
    table.dropIndex(["business_channel_id", "status"]);

    // Drop the columns
    table.dropColumn("agent_id");
    table.dropColumn("metadata");
  });
};
