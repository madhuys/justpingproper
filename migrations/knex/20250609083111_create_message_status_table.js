/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("message_status", function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("provider_message_id").notNullable();
    table
      .uuid("business_channel_id")
      .notNullable()
      .references("id")
      .inTable("business_channel")
      .onDelete("CASCADE");
    table
      .uuid("end_user_id")
      .nullable()
      .references("id")
      .inTable("end_user")
      .onDelete("SET NULL");
    table.string("status").notNullable();
    table.text("reason").nullable();
    table.string("error_code").nullable();
    table.timestamp("timestamp").notNullable().defaultTo(knex.fn.now());
    table.string("provider").nullable();
    table.jsonb("metadata").nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("message_status");
};
