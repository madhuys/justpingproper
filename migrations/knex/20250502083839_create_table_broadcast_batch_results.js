/**
 * Create the broadcast_batch_results table
 */
exports.up = function (knex) {
    return knex.schema.createTable("broadcast_batch_results", (table) => {
        // Use gen_random_uuid() which is available in PostgreSQL 13+
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

        table.uuid("broadcast_id").notNullable();
        table.string("status");
        table.string("provider").notNullable();
        table.jsonb("batch_response");
        table.string("batch_id");
        table.string("batch_status");
        table.string("batch_message");
        table.jsonb("metrics");
        table.integer("contact_count").notNullable();
        table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
        table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

        // Add index
        table.index("broadcast_id");
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("broadcast_batch_results");
};
