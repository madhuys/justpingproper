/**
 * Migration to create the channel table
 */
exports.up = function (knex) {
    return knex.schema.hasTable("channel").then(function (exists) {
        if (!exists) {
            return knex.schema.createTable("channel", (table) => {
                table
                    .uuid("id")
                    .defaultTo(knex.raw("uuid_generate_v4()"))
                    .primary();
                table.string("name", 50).notNullable();
                table.text("description").nullable();
                table.jsonb("providers_config_schema").defaultTo("[]");
                table
                    .uuid("created_by")
                    .nullable()
                    .references("id")
                    .inTable("business_user")
                    .onDelete("SET NULL");
                table
                    .uuid("business_id")
                    .nullable()
                    .references("id")
                    .inTable("business")
                    .onDelete("SET NULL");
                table.boolean("is_deleted").defaultTo(false);
                table.timestamp("created_at").defaultTo(knex.fn.now());
                table.timestamp("updated_at").defaultTo(knex.fn.now());

                // Add indexes
                table.index("business_id");
                table.index("created_by");
                table.index("is_deleted");
            });
        } else {
            // Table already exists
            return Promise.resolve();
        }
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("channel");
};
