exports.up = function (knex) {
    return knex.schema.createTable("language", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.string("code", 10).notNullable().unique();
        table.string("name", 100).notNullable();
        table.string("native_name", 100).nullable();
        table.boolean("is_active").defaultTo(true);
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("language");
};
