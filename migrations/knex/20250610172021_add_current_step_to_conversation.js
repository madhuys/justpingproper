exports.up = function (knex) {
  return knex.schema.alterTable("conversation", function (table) {
    // Add current_step column for tracking conversation flow steps
    table.string("current_step").nullable().defaultTo("step0");

    // Add index for performance when querying by current_step
    table.index("current_step");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("conversation", function (table) {
    // Drop index first
    table.dropIndex("current_step");

    // Drop the column
    table.dropColumn("current_step");
  });
};
