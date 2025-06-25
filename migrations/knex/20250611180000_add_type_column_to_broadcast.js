/**
 * Migration to add type column to broadcast table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("broadcast", function (table) {
    // Add the type column with enum validation
    table
      .enum("type", ["inbound", "outbound"])
      .notNullable()
      .defaultTo("outbound")
      .comment(
        "Broadcast type - inbound for incoming campaigns, outbound for marketing campaigns",
      );

    // Add index for performance when querying by type
    table.index("type");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("broadcast", function (table) {
    // Drop index first
    table.dropIndex("type");

    // Drop the type column
    table.dropColumn("type");
  });
};
