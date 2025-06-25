exports.up = function (knex) {
    return Promise.all([
        // Create campaign table if not exists
        knex.schema.hasTable("campaign").then(function (exists) {
            if (!exists) {
                return knex.schema.createTable("campaign", (table) => {
                    table
                        .uuid("id")
                        .primary()
                        .defaultTo(knex.raw("gen_random_uuid()"));
                    table
                        .uuid("business_id")
                        .notNullable()
                        .references("id")
                        .inTable("business")
                        .onDelete("CASCADE");
                    table.string("name", 255).notNullable();
                    table.text("description");
                    table.enum("type", ["outbound", "inbound"]).notNullable();
                    table
                        .uuid("channel_id")
                        .notNullable()
                        .references("id")
                        .inTable("channel")
                        .onDelete("CASCADE");
                    table
                        .enum("status", [
                            "draft",
                            "active",
                            "paused",
                            "completed",
                        ])
                        .notNullable()
                        .defaultTo("draft");
                    table
                        .uuid("created_by")
                        .notNullable()
                        .references("id")
                        .inTable("business_user")
                        .onDelete("SET NULL");
                    table
                        .timestamp("created_at", { useTz: true })
                        .notNullable()
                        .defaultTo(knex.fn.now());
                    table
                        .timestamp("updated_at", { useTz: true })
                        .notNullable()
                        .defaultTo(knex.fn.now());
                    table.jsonb("metadata").defaultTo("{}");
                    table.jsonb("aggregation").defaultTo("[]");
                    table.boolean("is_deleted").notNullable().defaultTo(false);

                    // Add indexes
                    table.index("business_id");
                    table.index("channel_id");
                    table.index("status");
                    table.index("created_at");
                });
            }
        }),

        // Create broadcast table if not exists
        knex.schema.hasTable("broadcast").then(function (exists) {
            if (!exists) {
                return knex.schema.createTable("broadcast", (table) => {
                    table
                        .uuid("id")
                        .primary()
                        .defaultTo(knex.raw("gen_random_uuid()"));
                    table
                        .uuid("campaign_id")
                        .notNullable()
                        .references("id")
                        .inTable("campaign")
                        .onDelete("CASCADE");
                    table.string("name", 255).notNullable();
                    table.text("description");
                    table
                        .enum("status", [
                            "scheduled",
                            "in_progress",
                            "completed",
                            "cancelled",
                            "failed",
                        ])
                        .notNullable()
                        .defaultTo("scheduled");
                    table
                        .uuid("business_channel_id")
                        .notNullable()
                        .references("id")
                        .inTable("business_channel")
                        .onDelete("CASCADE");
                    table.timestamp("scheduled_start", { useTz: true });
                    table.timestamp("actual_start", { useTz: true });
                    table.timestamp("actual_end", { useTz: true });
                    table
                        .uuid("template_id")
                        .references("id")
                        .inTable("template")
                        .onDelete("SET NULL");
                    table.jsonb("audience").defaultTo("{}");
                    table.jsonb("analytics").defaultTo("{}");
                    table.jsonb("metadata").defaultTo("{}");
                    table
                        .uuid("created_by")
                        .notNullable()
                        .references("id")
                        .inTable("business_user")
                        .onDelete("SET NULL");
                    table
                        .timestamp("created_at", { useTz: true })
                        .notNullable()
                        .defaultTo(knex.fn.now());
                    table
                        .timestamp("updated_at", { useTz: true })
                        .notNullable()
                        .defaultTo(knex.fn.now());

                    // Add indexes
                    table.index("campaign_id");
                    table.index("status");
                    table.index("scheduled_start");
                });
            }
        }),

        // Create broadcast_message table if not exists
        knex.schema.hasTable("broadcast_message").then(function (exists) {
            if (!exists) {
                return knex.schema.createTable("broadcast_message", (table) => {
                    table
                        .uuid("id")
                        .primary()
                        .defaultTo(knex.raw("gen_random_uuid()"));
                    table
                        .uuid("broadcast_id")
                        .notNullable()
                        .references("id")
                        .inTable("broadcast")
                        .onDelete("CASCADE");
                    table
                        .uuid("end_user_id")
                        .notNullable()
                        .references("id")
                        .inTable("end_user")
                        .onDelete("CASCADE");
                    table
                        .enum("status", [
                            "pending",
                            "sent",
                            "delivered",
                            "read",
                            "replied",
                            "failed",
                        ])
                        .notNullable()
                        .defaultTo("pending");
                    table
                        .uuid("business_channel_id")
                        .notNullable()
                        .references("id")
                        .inTable("business_channel")
                        .onDelete("CASCADE");
                    table.timestamp("sent_at", { useTz: true });
                    table.timestamp("delivered_at", { useTz: true });
                    table.timestamp("read_at", { useTz: true });
                    table.timestamp("replied_at", { useTz: true });
                    table.text("error_message");
                    table.jsonb("message_content").defaultTo("{}");
                    table.jsonb("metadata").defaultTo("{}");
                    table
                        .timestamp("created_at", { useTz: true })
                        .notNullable()
                        .defaultTo(knex.fn.now());
                    table
                        .timestamp("updated_at", { useTz: true })
                        .notNullable()
                        .defaultTo(knex.fn.now());

                    // Add indexes
                    table.index("broadcast_id");
                    table.index("end_user_id");
                    table.index("status");
                });
            }
        }),
    ]);
};

exports.down = function (knex) {
    return Promise.all([
        knex.schema.dropTableIfExists("broadcast_message"),
        knex.schema.dropTableIfExists("broadcast"),
        knex.schema.dropTableIfExists("campaign"),
    ]);
};
