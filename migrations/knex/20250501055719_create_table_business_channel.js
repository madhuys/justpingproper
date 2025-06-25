/**
 * Migration to create the business_channel table
 */
exports.up = function (knex) {
    return knex.schema.hasTable("business_channel").then(function (exists) {
        if (!exists) {
            return knex.schema.createTable("business_channel", (table) => {
                table
                    .uuid("id")
                    .defaultTo(knex.raw("uuid_generate_v4()"))
                    .primary();
                table
                    .uuid("business_id")
                    .notNullable()
                    .references("id")
                    .inTable("business")
                    .onDelete("CASCADE");
                table
                    .uuid("channel_id")
                    .notNullable()
                    .references("id")
                    .inTable("channel")
                    .onDelete("CASCADE");
                table.string("name", 100).notNullable();
                table.text("description").nullable();
                table.string("provider_id").notNullable();
                table.string("provider_name").notNullable();
                table.string("status").defaultTo("active");
                table.jsonb("config").notNullable().defaultTo("{}");
                table
                    .uuid("created_by")
                    .nullable()
                    .references("id")
                    .inTable("business_user")
                    .onDelete("SET NULL");
                table.boolean("is_deleted").defaultTo(false);
                table.timestamp("created_at").defaultTo(knex.fn.now());
                table.timestamp("updated_at").defaultTo(knex.fn.now());

                // Add composite unique constraint to prevent duplicates
                table.unique(["business_id", "name", "is_deleted"]);

                // Add indexes for better query performance
                table.index("business_id");
                table.index("channel_id");
                table.index("created_by");
                table.index("is_deleted");
                table.index("status");
            });
        } else {
            // Table already exists, we can add any missing columns or indices if needed
            return Promise.resolve();
        }
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("business_channel");
};
