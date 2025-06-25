/**
 * Migration to add contact management tables and fields
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.up = function (knex) {
  return (
    knex.schema
      // Create end_user table (Contact / Lead / Customer table)
      .createTable("end_user", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table
          .uuid("business_id")
          .notNullable()
          .references("id")
          .inTable("business")
          .onDelete("CASCADE");
        table.string("phone", 50);
        table.string("email", 255);
        table.string("first_name", 100);
        table.string("last_name", 100);
        table.string("source_type", 50);
        table.uuid("source_id");
        table.jsonb("channel_identifiers");
        table
          .timestamp("created_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table
          .timestamp("updated_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table.jsonb("preferences");
        table.jsonb("metadata");
        table.unique(["business_id", "phone"]);
        table.unique(["business_id", "email"]);
      })

      // Create contact_group table
      .createTable("contact_group", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table
          .uuid("business_id")
          .notNullable()
          .references("id")
          .inTable("business")
          .onDelete("CASCADE");
        table.string("name", 255).notNullable();
        table.text("description");
        table
          .timestamp("created_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table
          .timestamp("updated_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table
          .uuid("created_by")
          .references("id")
          .inTable("business_user")
          .onDelete("SET NULL");
        table.unique(["business_id", "name"]);
      })

      // Create contact_group_field table
      .createTable("contact_group_field", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table
          .uuid("contact_group_id")
          .notNullable()
          .references("id")
          .inTable("contact_group")
          .onDelete("CASCADE");
        table.string("name", 100).notNullable();
        table.string("field_type", 50).notNullable(); // text, number, date, etc.
        table.boolean("is_required").notNullable().defaultTo(false);
        table.text("default_value");
        table.jsonb("validation_rules");
        table
          .timestamp("created_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table
          .timestamp("updated_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table
          .uuid("created_by")
          .references("id")
          .inTable("business_user")
          .onDelete("SET NULL");
        table.unique(["contact_group_id", "name"]);
      })

      // Create contact_group_association table (mapping between end_user and contact_group)
      .createTable("contact_group_association", (table) => {
        table
          .uuid("contact_group_id")
          .notNullable()
          .references("id")
          .inTable("contact_group")
          .onDelete("CASCADE");
        table
          .uuid("end_user_id")
          .notNullable()
          .references("id")
          .inTable("end_user")
          .onDelete("CASCADE");
        table
          .timestamp("created_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table
          .uuid("created_by")
          .references("id")
          .inTable("business_user")
          .onDelete("SET NULL");
        table.jsonb("field_values"); // Custom field values for this contact
        table.primary(["contact_group_id", "end_user_id"]);
      })

      // Create contact_upload table (for tracking bulk uploads)
      .createTable("contact_upload", (table) => {
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
        table
          .uuid("contact_group_id")
          .references("id")
          .inTable("contact_group")
          .onDelete("SET NULL");
        table.string("filename", 255).notNullable();
        table.string("original_filename", 255).notNullable();
        table.integer("file_size").notNullable();
        table.string("status", 20).notNullable().defaultTo("pending"); // pending, processing, completed, failed
        table.integer("total_records");
        table.integer("processed_records").defaultTo(0);
        table.integer("accepted_records").defaultTo(0);
        table.integer("rejected_records").defaultTo(0);
        table.jsonb("errors");
        table
          .timestamp("created_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table
          .timestamp("updated_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table.timestamp("completed_at", { useTz: true });
      })

      // Create indexes for performance optimization
      .raw("CREATE INDEX idx_end_user_business_id ON end_user(business_id)")
      .raw("CREATE INDEX idx_end_user_phone ON end_user(phone)")
      .raw("CREATE INDEX idx_end_user_email ON end_user(email)")
      .raw(
        "CREATE INDEX idx_end_user_source ON end_user(source_type, source_id)"
      )
      .raw(
        "CREATE INDEX idx_contact_group_business_id ON contact_group(business_id)"
      )
      .raw(
        "CREATE INDEX idx_contact_group_association_end_user_id ON contact_group_association(end_user_id)"
      )
      .raw(
        "CREATE INDEX idx_contact_upload_business_id ON contact_upload(business_id)"
      )
      .raw("CREATE INDEX idx_contact_upload_status ON contact_upload(status)")
      .raw(
        "CREATE INDEX idx_contact_group_field_group_id ON contact_group_field(contact_group_id)"
      )
  );
};

/**
 * Rollback the contact management tables
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("contact_upload")
    .dropTableIfExists("contact_group_association")
    .dropTableIfExists("contact_group_field")
    .dropTableIfExists("contact_group")
    .dropTableIfExists("end_user");
};
