/**
 * Migration to add team management tables
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.up = function (knex) {
  return (
    knex.schema
      // Create team table
      .createTable("team", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table
          .uuid("business_id")
          .notNullable()
          .references("id")
          .inTable("business")
          .onDelete("CASCADE");
        table.string("name", 100).notNullable();
        table.text("description");
        table.string("status", 20).notNullable().defaultTo("active");
        table
          .timestamp("created_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table
          .timestamp("updated_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table.jsonb("settings");
        table.unique(["business_id", "name"]);
      })

      // Create team_member table
      .createTable("team_member", (table) => {
        table
          .uuid("team_id")
          .notNullable()
          .references("id")
          .inTable("team")
          .onDelete("CASCADE");
        table
          .uuid("user_id")
          .notNullable()
          .references("id")
          .inTable("business_user")
          .onDelete("CASCADE");
        table.string("role", 50);
        table
          .timestamp("created_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table.primary(["team_id", "user_id"]);
      })

      // Create indexes for faster querying
      .raw("CREATE INDEX idx_team_business_id ON team(business_id)")
      .raw("CREATE INDEX idx_team_status ON team(status)")
      .raw("CREATE INDEX idx_team_member_team_id ON team_member(team_id)")
      .raw("CREATE INDEX idx_team_member_user_id ON team_member(user_id)")
  );
};

/**
 * Rollback the team management tables
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("team_member").dropTableIfExists("team");
};
