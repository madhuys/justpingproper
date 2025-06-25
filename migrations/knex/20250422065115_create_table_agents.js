/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // Check if table exists before creating it
    const exists = await knex.schema.hasTable("agents");

    if (!exists) {
        return knex.schema.createTable("agents", (table) => {
            // Use the gen_random_uuid() function which is available in Azure PostgreSQL
            // or let the application handle UUID generation
            table.uuid("id").defaultTo(knex.raw("gen_random_uuid()")).primary();
            table
                .uuid("business_id")
                .notNullable()
                .references("id")
                .inTable("business")
                .onDelete("CASCADE");
            table.string("name").notNullable();
            table.text("description").nullable();
            table.text("key_words").defaultTo("[]");
            table
                .enum("status", [
                    "draft",
                    "pending_approval",
                    "approved",
                    "rejected",
                ])
                .defaultTo("draft");
            table
                .uuid("created_by")
                .notNullable()
                .references("id")
                .inTable("business_user");
            table.boolean("is_active").defaultTo(false);
            table.boolean("is_deleted").defaultTo(false);
            table.timestamp("created_at").defaultTo(knex.fn.now());
            table.timestamp("updated_at").defaultTo(knex.fn.now());
            table
                .uuid("approved_by")
                .nullable()
                .references("id")
                .inTable("business_user");
            table.timestamp("approved_at").nullable();
            table.text("ai_character").nullable();
            table.text("global_rules").nullable();
            table
                .jsonb("agent_definition")
                .defaultTo('{"nodes":[], "connections":[]}');
            table.jsonb("metadata").defaultTo("{}");
            table.text("variables").defaultTo("[]"); // Add variables as JSONB array
            table.integer("version").defaultTo(1);

            table.unique(["business_id", "name", "is_deleted"]);
        });
    } else {
        console.log("Table 'agents' already exists, skipping creation");
        // You could add code here to alter the table if needed
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists("agents");
};
