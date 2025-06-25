exports.up = function (knex) {
  return Promise.all([
    // Check if country_code exists in end_user table, add if it doesn't
    knex.schema.hasColumn("end_user", "country_code").then((exists) => {
      if (!exists) {
        return knex.schema.alterTable("end_user", (table) => {
          table.string("country_code", 10).after("phone");
        });
      }
    }),

    // Check if deleted exists in end_user table, add if it doesn't
    knex.schema.hasColumn("end_user", "deleted").then((exists) => {
      if (!exists) {
        return knex.schema.alterTable("end_user", (table) => {
          table.boolean("deleted").notNullable().defaultTo(false);
        });
      }
    }),

    // Add deleted column to other tables that need it according to the schema
    knex.schema.hasColumn("business_user", "deleted").then((exists) => {
      if (!exists) {
        return knex.schema.alterTable("business_user", (table) => {
          table.boolean("deleted").notNullable().defaultTo(false);
        });
      }
    }),

    knex.schema
      .hasColumn("business_user_invitation", "deleted")
      .then((exists) => {
        if (!exists) {
          return knex.schema.alterTable("business_user_invitation", (table) => {
            table.boolean("deleted").notNullable().defaultTo(false);
          });
        }
      }),

    knex.schema.hasColumn("document", "deleted").then((exists) => {
      if (!exists) {
        return knex.schema.alterTable("document", (table) => {
          table.boolean("deleted").notNullable().defaultTo(false);
        });
      }
    }),
  ]);
};

exports.down = function (knex) {
  return Promise.all([
    knex.schema.hasColumn("end_user", "country_code").then((exists) => {
      if (exists) {
        return knex.schema.alterTable("end_user", (table) => {
          table.dropColumn("country_code");
        });
      }
    }),

    knex.schema.hasColumn("end_user", "deleted").then((exists) => {
      if (exists) {
        return knex.schema.alterTable("end_user", (table) => {
          table.dropColumn("deleted");
        });
      }
    }),

    // Only remove deleted columns we added (not from end_user since it's in the original schema)
    knex.schema.hasColumn("business_user", "deleted").then((exists) => {
      if (exists) {
        return knex.schema.alterTable("business_user", (table) => {
          table.dropColumn("deleted");
        });
      }
    }),

    knex.schema
      .hasColumn("business_user_invitation", "deleted")
      .then((exists) => {
        if (exists) {
          return knex.schema.alterTable("business_user_invitation", (table) => {
            table.dropColumn("deleted");
          });
        }
      }),

    knex.schema.hasColumn("document", "deleted").then((exists) => {
      if (exists) {
        return knex.schema.alterTable("document", (table) => {
          table.dropColumn("deleted");
        });
      }
    }),
  ]);
};
