// system/models/Document.js
const { Model } = require("objection");
const { v4: uuidv4 } = require("uuid");

class Document extends Model {
  static get tableName() {
    return "document";
  }

  static get idColumn() {
    return "id";
  }

  $beforeInsert() {
    this.id = this.id || uuidv4();
    this.created_at = new Date();
    this.updated_at = new Date();
  }

  $beforeUpdate() {
    this.updated_at = new Date();
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: [
        "business_id",
        "uploaded_by",
        "file_name",
        "file_type",
        "file_size",
        "file_path",
      ],
      properties: {
        id: { type: "string", format: "uuid" },
        business_id: { type: "string", format: "uuid" },
        uploaded_by: { type: "string", format: "uuid" },
        file_name: { type: "string", maxLength: 255 },
        file_type: { type: "string", maxLength: 100 },
        file_size: { type: "integer" },
        file_path: { type: "string" },
        description: { type: ["string", "null"] },
        document_type: { type: ["string", "null"], maxLength: 50 },
        status: { type: "string", maxLength: 20, default: "active" },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
        metadata: { type: ["object", "null"] },
      },
    };
  }

  static get relationMappings() {
    const Business = require("./Business");
    const BusinessUser = require("./BusinessUser");

    return {
      business: {
        relation: Model.BelongsToOneRelation,
        modelClass: Business,
        join: {
          from: "document.business_id",
          to: "business.id",
        },
      },
      uploader: {
        relation: Model.BelongsToOneRelation,
        modelClass: BusinessUser,
        join: {
          from: "document.uploaded_by",
          to: "business_user.id",
        },
      },
    };
  }

  // Helper method to find documents by business ID with pagination
  static async findByBusinessId(
    businessId,
    documentType = null,
    page = 1,
    limit = 20
  ) {
    const query = this.query()
      .where("business_id", businessId)
      .orderBy("created_at", "desc");

    if (documentType) {
      query.where("document_type", documentType);
    }

    const results = await query.page(page - 1, limit);

    return {
      data: results.results,
      total: results.total,
      page,
      limit,
    };
  }
}

module.exports = Document;
