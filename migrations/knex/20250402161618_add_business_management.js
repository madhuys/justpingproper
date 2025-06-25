// migrations/knex/20250325000001_auth_schema.js

exports.up = function (knex) {
  return (
    knex.schema
      // Instead of using uuid-ossp extension, use gen_random_uuid() which is available in newer PostgreSQL versions
      // or modify the tables to use application-generated UUIDs

      // Business table
      .createTable("business", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.string("name", 255).notNullable();
        table.text("description");
        table.string("website", 255);
        table.string("profile_image", 255);
        table.string("industry", 100);
        table.string("subscription_plan", 50).notNullable();
        table.string("status", 20).notNullable().defaultTo("active");
        table
          .timestamp("created_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table
          .timestamp("updated_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table.jsonb("billing_info");
        table.jsonb("contact_info");
        table.jsonb("settings");
        table.jsonb("kyc");
      })

      // Business User table
      .createTable("business_user", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table
          .uuid("business_id")
          .notNullable()
          .references("id")
          .inTable("business")
          .onDelete("CASCADE");
        table.string("email", 255).notNullable();
        table.string("password_hash", 255);
        table.string("first_name", 128).notNullable();
        table.string("last_name", 128).notNullable();
        table.string("status", 20).notNullable().defaultTo("active");
        table.timestamp("last_login", { useTz: true });
        table.boolean("email_verified").notNullable().defaultTo(false);
        table.timestamp("email_verified_at", { useTz: true });
        table.boolean("is_onboarded").notNullable().defaultTo(false);
        table.boolean("is_password_created").notNullable().defaultTo(false);
        table.boolean("is_reminder").notNullable().defaultTo(false);
        table.integer("failed_login_attempts").notNullable().defaultTo(0);
        table.timestamp("locked_out_until", { useTz: true });
        table
          .timestamp("created_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table
          .timestamp("updated_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table.jsonb("settings");
        table.jsonb("metadata");
        table.unique(["business_id", "email"]);
      })

      // Role table
      .createTable("role", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table
          .uuid("business_id")
          .notNullable()
          .references("id")
          .inTable("business")
          .onDelete("CASCADE");
        table.string("name", 100).notNullable();
        table.text("description");
        table.jsonb("permissions").notNullable();
        table
          .timestamp("created_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table
          .timestamp("updated_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table.unique(["business_id", "name"]);
      })

      // Business User Role mapping
      .createTable("business_user_role", (table) => {
        table
          .uuid("user_id")
          .notNullable()
          .references("id")
          .inTable("business_user")
          .onDelete("CASCADE");
        table
          .uuid("role_id")
          .notNullable()
          .references("id")
          .inTable("role")
          .onDelete("CASCADE");
        table
          .timestamp("created_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table.primary(["user_id", "role_id"]);
      })

      // Business User Invitation
      .createTable("business_user_invitation", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table
          .uuid("business_id")
          .notNullable()
          .references("id")
          .inTable("business")
          .onDelete("CASCADE");
        table.string("email", 255).notNullable();
        table
          .uuid("invited_by")
          .notNullable()
          .references("id")
          .inTable("business_user")
          .onDelete("CASCADE");
        table.string("token", 255).notNullable().unique();
        table
          .uuid("role_id")
          .references("id")
          .inTable("role")
          .onDelete("CASCADE");
        table.string("status", 20).notNullable().defaultTo("pending");
        table.timestamp("expires_at", { useTz: true }).notNullable();
        table
          .timestamp("created_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table
          .timestamp("updated_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table.unique(["business_id", "email", "status"]);
      })

      // Create indexes for performance
      .raw(
        "CREATE INDEX idx_business_user_business_id ON business_user(business_id)"
      )
      .raw("CREATE INDEX idx_business_user_email ON business_user(email)")
      .raw(
        "CREATE INDEX idx_business_user_invitation_business_id ON business_user_invitation(business_id)"
      )
      .raw(
        "CREATE INDEX idx_business_user_invitation_email ON business_user_invitation(email)"
      )
      .raw(
        "CREATE INDEX idx_business_user_invitation_token ON business_user_invitation(token)"
      )
  );
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("business_user_invitation")
    .dropTableIfExists("business_user_role")
    .dropTableIfExists("role")
    .dropTableIfExists("business_user")
    .dropTableIfExists("business");
};
