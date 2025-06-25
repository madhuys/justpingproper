/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    const exists = await knex.schema.hasTable("agent_nodes");

    if (!exists) {
        return knex.schema.createTable("agent_nodes", (table) => {
            table.uuid("id").defaultTo(knex.raw("gen_random_uuid()")).primary();
            table
                .uuid("agent_id")
                .notNullable()
                .references("id")
                .inTable("agents")
                .onDelete("CASCADE");
            table.string("step").notNullable();
            table.string("step_name").notNullable();
            table.string("variable").nullable();
            table.boolean("mandatory").defaultTo(false);
            table.string("check_post").nullable();
            table.string("purpose").nullable();
            table.boolean("enable_ai_takeover").defaultTo(false);
            table.uuid("ai_config_id").nullable();
            table.string("regex").nullable();
            table.jsonb("next_possible_steps").defaultTo("[]");
            table.string("type_of_message").defaultTo("text");
            table.jsonb("message_content").defaultTo("{}");
            table.jsonb("media_items").defaultTo("[]");
            table.timestamp("created_at").defaultTo(knex.fn.now());
            table.timestamp("updated_at").defaultTo(knex.fn.now());

            // Create an index on agent_id for faster lookups
            table.index("agent_id");

            // Each step should be unique within an agent
            table.unique(["agent_id", "step"]);
        });
    } else {
        console.log("Table 'agent_nodes' already exists, skipping creation");
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists("agent_nodes");
};
