exports.up = function (knex) {
  return (
    knex.schema
      // Add firebase_uid to business_user table
      .table("business_user", (table) => {
        table.string("firebase_uid").unique();
        // Make password_hash nullable since we'll be using Firebase for auth
        table.string("password_hash").nullable().alter();
      })

      // Create token_blacklist table if it doesn't exist
      .createTable("token_blacklist", (table) => {
        table.increments("id").primary();
        table.text("token").notNullable().unique();
        table.timestamp("expires_at", { useTz: true }).notNullable();
        table
          .timestamp("created_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());

        // Index for quick lookups
        table.index("token");
        table.index("expires_at");
      })
  );
};

exports.down = function (knex) {
  return knex.schema
    .table("business_user", (table) => {
      table.dropColumn("firebase_uid");
      // Make password_hash required again
      table.string("password_hash").notNullable().alter();
    })
    .dropTableIfExists("token_blacklist");
};
