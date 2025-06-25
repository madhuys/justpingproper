exports.up = function (knex) {
    return knex.schema.createTable("message", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table
            .uuid("conversation_id")
            .notNullable()
            .references("id")
            .inTable("conversation");
        table.string("sender_type").notNullable();
        table.uuid("sender_id").notNullable();
        table.text("content");
        table.string("content_type").defaultTo("text");
        table.jsonb("metadata").defaultTo("{}");
        table.boolean("is_internal").defaultTo(false);
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
        table.timestamp("delivered_at");
        table.timestamp("read_at");
        table.string("external_id");

        // Add index for faster querying
        table.index("conversation_id");
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("message");
};
