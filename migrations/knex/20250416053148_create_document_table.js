// system/db/migrations/20230501000000_create_document_table.js
exports.up = function (knex) {
    return knex.schema.createTable("document", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table
            .uuid("business_id")
            .notNullable()
            .references("id")
            .inTable("business")
            .onDelete("CASCADE");
        table
            .uuid("uploaded_by")
            .notNullable()
            .references("id")
            .inTable("business_user")
            .onDelete("CASCADE");
        table.string("file_name", 255).notNullable();
        table.string("file_type", 100).notNullable();
        table.integer("file_size").notNullable();
        table.text("file_path").notNullable();
        table.text("description");
        table.string("document_type", 50);
        table.string("status", 20).notNullable().defaultTo("active");
        table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
        table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
        table.jsonb("metadata");

        // Add indexes
        table.index("business_id");
        table.index("uploaded_by");
        table.index("document_type");
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("document");
};
