/**
 * Migration to create broadcast table
 */
exports.up = function (knex) {
    return knex.schema
        .createTable("broadcast", (table) => {
            // Primary key - use Postgres' built-in gen_random_uuid() which is available in Azure PostgreSQL
            // or fall back to regular UUID type that will be filled by the application
            table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

            // Core fields
            table
                .uuid("campaign_id")
                .notNullable()
                .references("id")
                .inTable("campaign")
                .onDelete("CASCADE");
            table.string("name", 255).notNullable();
            table.text("description").nullable();
            table
                .enum("status", [
                    "draft",
                    "scheduled",
                    "active",
                    "paused",
                    "completed",
                    "cancelled",
                    "failed",
                ])
                .defaultTo("draft");
            table
                .uuid("business_channel_id")
                .notNullable()
                .references("id")
                .inTable("business_channel");
            table
                .uuid("template_id")
                .notNullable()
                .references("id")
                .inTable("template");
            table
                .uuid("contact_group_id")
                .notNullable()
                .references("id")
                .inTable("contact_group");

            // Schedule fields
            table
                .enum("schedule_type", ["immediate", "scheduled", "recurring"])
                .defaultTo("scheduled");
            table.timestamp("scheduled_start").nullable();
            table.timestamp("scheduled_end").nullable();
            table.timestamp("actual_start").nullable();
            table.timestamp("actual_end").nullable();

            // JSON fields
            table.jsonb("variable_mapping").defaultTo("{}");
            table.jsonb("default_message").defaultTo("{}");
            table.jsonb("agent_mapping").defaultTo("{}");
            table.jsonb("audience").nullable();
            table.jsonb("analytics").nullable();
            table.jsonb("metadata").defaultTo("{}");

            // Relationship fields
            table
                .uuid("original_broadcast_id")
                .nullable()
                .references("id")
                .inTable("broadcast");

            // Audit fields
            table
                .uuid("created_by")
                .notNullable()
                .references("id")
                .inTable("business_user");
            table
                .timestamp("created_at")
                .notNullable()
                .defaultTo(knex.fn.now());
            table
                .timestamp("updated_at")
                .notNullable()
                .defaultTo(knex.fn.now());
            table.boolean("is_deleted").defaultTo(false);

            // Indexes
            table.index("campaign_id");
            table.index("business_channel_id");
            table.index("contact_group_id");
            table.index("template_id");
            table.index("status");
            table.index("created_by");
        })
        .catch((err) => {
            // If gen_random_uuid() is not available, try again with a different approach
            if (err.message.includes("gen_random_uuid")) {
                console.warn(
                    "gen_random_uuid() not available, creating table without default UUID generation",
                );
                return knex.schema.createTable("broadcast", (table) => {
                    // Primary key without default - app will need to generate UUIDs
                    table.uuid("id").primary();

                    // Core fields
                    table
                        .uuid("campaign_id")
                        .notNullable()
                        .references("id")
                        .inTable("campaign")
                        .onDelete("CASCADE");
                    table.string("name", 255).notNullable();
                    table.text("description").nullable();
                    table
                        .enum("status", [
                            "draft",
                            "scheduled",
                            "active",
                            "paused",
                            "completed",
                            "cancelled",
                            "failed",
                        ])
                        .defaultTo("draft");
                    table
                        .uuid("business_channel_id")
                        .notNullable()
                        .references("id")
                        .inTable("business_channel");
                    table
                        .uuid("template_id")
                        .notNullable()
                        .references("id")
                        .inTable("template");
                    table
                        .uuid("contact_group_id")
                        .notNullable()
                        .references("id")
                        .inTable("contact_group");

                    // Schedule fields
                    table
                        .enum("schedule_type", [
                            "immediate",
                            "scheduled",
                            "recurring",
                        ])
                        .defaultTo("scheduled");
                    table.timestamp("scheduled_start").nullable();
                    table.timestamp("scheduled_end").nullable();
                    table.timestamp("actual_start").nullable();
                    table.timestamp("actual_end").nullable();

                    // JSON fields
                    table.jsonb("variable_mapping").defaultTo("{}");
                    table.jsonb("default_message").defaultTo("{}");
                    table.jsonb("agent_mapping").defaultTo("{}");
                    table.jsonb("audience").nullable();
                    table.jsonb("analytics").nullable();
                    table.jsonb("metadata").defaultTo("{}");

                    // Relationship fields
                    table
                        .uuid("original_broadcast_id")
                        .nullable()
                        .references("id")
                        .inTable("broadcast");

                    // Audit fields
                    table
                        .uuid("created_by")
                        .notNullable()
                        .references("id")
                        .inTable("business_user");
                    table
                        .timestamp("created_at")
                        .notNullable()
                        .defaultTo(knex.fn.now());
                    table
                        .timestamp("updated_at")
                        .notNullable()
                        .defaultTo(knex.fn.now());
                    table.boolean("is_deleted").defaultTo(false);

                    // Indexes
                    table.index("campaign_id");
                    table.index("business_channel_id");
                    table.index("contact_group_id");
                    table.index("template_id");
                    table.index("status");
                    table.index("created_by");
                });
            }
            console.error("Migration failed:", err);
            throw err;
        });
};

exports.down = function (knex) {
    return knex.schema.dropTable("broadcast");
};
