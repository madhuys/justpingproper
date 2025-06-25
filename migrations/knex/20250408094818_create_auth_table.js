// migrations/knex/20250408094818_create_auth_table.js

exports.up = async function (knex) {
    // Check if tables exist before creating them
    const tokenBlacklistExists = await knex.schema.hasTable("token_blacklist");
    const ssoStateExists = await knex.schema.hasTable("sso_state");

    // Create tables only if they don't exist
    const promises = [];

    if (!tokenBlacklistExists) {
        promises.push(
            knex.schema.createTable("token_blacklist", (table) => {
                table.increments("id").primary();
                table.text("token").notNullable().unique();
                table.timestamp("expires_at", { useTz: true }).notNullable();
                table
                    .timestamp("created_at", { useTz: true })
                    .notNullable()
                    .defaultTo(knex.fn.now());

                // Add indexes for performance
                table.index("token");
                table.index("expires_at");
            }),
        );
    }

    if (!ssoStateExists) {
        promises.push(
            knex.schema.createTable("sso_state", (table) => {
                table
                    .uuid("id")
                    .primary()
                    .defaultTo(knex.raw("gen_random_uuid()"));
                table.string("state", 255).notNullable().unique();
                table.string("redirect_uri", 1024).notNullable();
                table.string("business_domain", 255);
                table.timestamp("expires_at", { useTz: true }).notNullable();
                table
                    .timestamp("created_at", { useTz: true })
                    .notNullable()
                    .defaultTo(knex.fn.now());

                // Add index for performance
                table.index("state");
                table.index("expires_at");
            }),
        );
    }

    return Promise.all(promises);
};

exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists("sso_state")
        .dropTableIfExists("token_blacklist");
};
