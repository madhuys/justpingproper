/**
 * Migration to create tag and conversation_tag tables
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.up = function (knex) {
  return (
    knex.schema
      // Create tag table
      .createTable("tag", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table
          .uuid("business_id")
          .notNullable()
          .references("id")
          .inTable("business")
          .onDelete("CASCADE");
        table.string("name", 100).notNullable();
        table.string("color", 20).defaultTo("#808080");
        table.string("description").nullable();
        table.uuid("created_by").nullable();
        table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
        table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

        // Each tag name should be unique within a business
        table.unique(["business_id", "name"]);
      })

      // Create conversation_tag table (junction table)
      .createTable("conversation_tag", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table
          .uuid("conversation_id")
          .notNullable()
          .references("id")
          .inTable("conversation")
          .onDelete("CASCADE");
        table
          .uuid("tag_id")
          .notNullable()
          .references("id")
          .inTable("tag")
          .onDelete("CASCADE");
        table.uuid("created_by").nullable();
        table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

        // Each tag should only be applied once to a conversation
        table.unique(["conversation_id", "tag_id"]);
      })

      // Create indexes for faster querying
      .raw("CREATE INDEX idx_tag_business_id ON tag(business_id)")
      .raw(
        "CREATE INDEX idx_conversation_tag_conversation_id ON conversation_tag(conversation_id)"
      )
      .raw(
        "CREATE INDEX idx_conversation_tag_tag_id ON conversation_tag(tag_id)"
      )
  );
};

/**
 * Rollback the tag tables
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("conversation_tag")
    .dropTableIfExists("tag");
};
