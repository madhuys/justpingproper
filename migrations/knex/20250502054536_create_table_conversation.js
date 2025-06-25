exports.up = function (knex) {
    return knex.schema.createTable("conversation", (table) => {
        // Use gen_random_uuid() which is available in PostgreSQL 13+
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

        table.uuid("business_id").notNullable();
        table.uuid("end_user_id").notNullable();
        table.uuid("business_channel_id").notNullable();
        table.uuid("broadcast_id").nullable();
        table.string("type").notNullable().defaultTo("support");
        table.string("status").notNullable().defaultTo("active");
        table.string("priority").defaultTo("normal");
        table.string("category").nullable();
        table.uuid("created_by").nullable();
        table.uuid("updated_by").nullable();
        table.string("external_id").nullable();

        // Add missing timestamp columns that are in your model
        table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
        table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
        table.timestamp("resolved_at").nullable();
        table.timestamp("closed_at").nullable();
        table.timestamp("first_response_at").nullable();
        table.timestamp("last_message_at").nullable();
        table.integer("unread_count").defaultTo(0);

        // Add foreign key constraints
        table.foreign("business_id").references("id").inTable("business");
        table.foreign("end_user_id").references("id").inTable("end_user");
        table
            .foreign("business_channel_id")
            .references("id")
            .inTable("business_channel");

        // Add indexes for frequently queried columns
        table.index("business_id");
        table.index("end_user_id");
        table.index("business_channel_id");
        table.index("status");
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("conversation");
};
