/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("message", function (table) {
    table.string("provider_message_id").nullable();
    table.string("provider").nullable();
    table.string("status").nullable();
    table.uuid("end_user_id").nullable().references("id").inTable("end_user").onDelete("SET NULL");
    table.uuid("business_channel_id").nullable().references("id").inTable("business_channel").onDelete("SET NULL");
    table.string("message_type").nullable();
    table.string("direction").nullable();
    table.jsonb("message_content").nullable();
    table.timestamp("sent_at").nullable();
    table.uuid("template_id").nullable();
    table.uuid("broadcast_id").nullable();
    
    // Add indexes for better performance
    table.index("provider_message_id");
    table.index("end_user_id");
    table.index("business_channel_id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("message", function (table) {
    table.dropColumn("provider_message_id");
    table.dropColumn("provider");
    table.dropColumn("status");
    table.dropColumn("end_user_id");
    table.dropColumn("business_channel_id");
    table.dropColumn("message_type");
    table.dropColumn("direction");
    table.dropColumn("message_content");
    table.dropColumn("sent_at");
    table.dropColumn("template_id");
    table.dropColumn("broadcast_id");
  });
};
