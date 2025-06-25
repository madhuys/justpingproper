/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    const exists = await knex.schema.hasTable("ai_configs");

    if (!exists) {
        await knex.schema.createTable("ai_configs", (table) => {
            table.uuid("id").defaultTo(knex.raw("gen_random_uuid()")).primary();
            table
                .uuid("node_id")
                .notNullable()
                .references("id")
                .inTable("agent_nodes")
                .onDelete("CASCADE");
            table.text("system_prompt").nullable();
            table.string("ai_provider").defaultTo("gpt");
            table.string("model").defaultTo("gpt-4o");
            table.integer("max_tokens").defaultTo(1024);
            table.float("temperature").defaultTo(0.7);
            table.text("context_input").nullable();
            table.timestamp("created_at").defaultTo(knex.fn.now());
            table.timestamp("updated_at").defaultTo(knex.fn.now());

            // Create an index on node_id for faster lookups
            table.index("node_id");

            // Each node should have only one AI config
            table.unique(["node_id"]);
        });

        // Now add the foreign key reference from agent_nodes to ai_configs
        return knex.schema.alterTable("agent_nodes", (table) => {
            table
                .foreign("ai_config_id")
                .references("id")
                .inTable("ai_configs")
                .onDelete("SET NULL");
        });
    } else {
        console.log("Table 'ai_configs' already exists, skipping creation");
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .alterTable("agent_nodes", (table) => {
            table.dropForeign(["ai_config_id"]);
        })
        .then(() => {
            return knex.schema.dropTableIfExists("ai_configs");
        });
};
