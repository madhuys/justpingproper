// system/models/BusinessDocument.js
const Document = require("./Document");

class BusinessDocument extends Document {
  static get tableName() {
    return "document";
  }

  // Additional business document specific methods can be added here

  // Find document by ID and business ID
  static async findByIdAndBusinessId(id, businessId) {
    return this.query()
      .where({
        id: id,
        business_id: businessId,
      })
      .first();
  }

  // Get all documents for a business with optional filtering and pagination
  static async getBusinessDocuments(
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

    return query.page(page - 1, limit);
  }
}

module.exports = BusinessDocument;
