// migrations/knex/20250416115221_add_business_verification.js
/**
 * Migration to add business verification table and enhance document table
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  // First check if the document table exists
  const hasDocumentTable = await knex.schema.hasTable("document");

  if (hasDocumentTable) {
    // Check for each column before adding it
    const documentColumns = await knex("information_schema.columns")
      .select("column_name")
      .where({
        table_name: "document",
        table_schema: "public",
      });

    const columnNames = documentColumns.map((c) => c.column_name);

    // Add verification fields to document table
    await knex.schema.table("document", (table) => {
      // Add verification fields if they don't exist
      if (!columnNames.includes("verification_status")) {
        table.string("verification_status", 50).defaultTo("pending");
      }
      if (!columnNames.includes("verified_by")) {
        table
          .uuid("verified_by")
          .references("id")
          .inTable("business_user")
          .onDelete("SET NULL");
      }
      if (!columnNames.includes("verified_at")) {
        table.timestamp("verified_at", { useTz: true });
      }
      if (!columnNames.includes("rejection_reason")) {
        table.text("rejection_reason");
      }
    });

    // Add indexes for document verification fields after the columns are created
    // Use raw queries with IF NOT EXISTS to avoid errors
    await knex.schema.raw(
      "CREATE INDEX IF NOT EXISTS idx_document_verification_status ON document(verification_status)"
    );
    await knex.schema.raw(
      "CREATE INDEX IF NOT EXISTS idx_document_verified_by ON document(verified_by)"
    );
  }

  // Create business_verification table if it doesn't exist
  if (!(await knex.schema.hasTable("business_verification"))) {
    await knex.schema.createTable("business_verification", (table) => {
      table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
      table
        .uuid("business_id")
        .notNullable()
        .references("id")
        .inTable("business")
        .onDelete("CASCADE");
      table.string("verification_type", 50).notNullable();
      table.string("status", 50).notNullable().defaultTo("pending");
      table
        .uuid("verified_by")
        .references("id")
        .inTable("business_user")
        .onDelete("SET NULL");
      table.timestamp("verified_at", { useTz: true });
      table.text("rejection_reason");
      table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());

      // Add unique constraint for business_id and verification_type
      table.unique(["business_id", "verification_type"]);
    });

    // Add indexes for business_verification table
    await knex.schema.raw(
      "CREATE INDEX IF NOT EXISTS idx_business_verification_business_id ON business_verification(business_id)"
    );
    await knex.schema.raw(
      "CREATE INDEX IF NOT EXISTS idx_business_verification_status ON business_verification(status)"
    );
  }
};

/**
 * Rollback the migration
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  // Drop indexes for document table
  await knex.schema.raw(
    "DROP INDEX IF EXISTS idx_document_verification_status"
  );
  await knex.schema.raw("DROP INDEX IF EXISTS idx_document_verified_by");

  // Check if document table exists before trying to modify it
  const hasDocumentTable = await knex.schema.hasTable("document");

  if (hasDocumentTable) {
    // Get column information outside the table callback
    const documentColumns = await knex("information_schema.columns")
      .select("column_name")
      .where({
        table_name: "document",
        table_schema: "public",
      });

    const columnNames = documentColumns.map((c) => c.column_name);

    // Remove verification columns from document table if they exist
    if (
      columnNames.includes("verification_status") ||
      columnNames.includes("verified_by") ||
      columnNames.includes("verified_at") ||
      columnNames.includes("rejection_reason")
    ) {
      await knex.schema.table("document", (table) => {
        if (columnNames.includes("verification_status")) {
          table.dropColumn("verification_status");
        }
        if (columnNames.includes("verified_by")) {
          table.dropColumn("verified_by");
        }
        if (columnNames.includes("verified_at")) {
          table.dropColumn("verified_at");
        }
        if (columnNames.includes("rejection_reason")) {
          table.dropColumn("rejection_reason");
        }
      });
    }
  }

  // Drop business_verification table
  await knex.schema.dropTableIfExists("business_verification");
};
