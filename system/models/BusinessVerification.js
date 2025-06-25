// system/models/BusinessVerification.js
const BaseModel = require("./BaseModel");

class BusinessVerification extends BaseModel {
  static get tableName() {
    return "business_verification";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["business_id", "verification_type", "status"],
      properties: {
        id: { type: "string", format: "uuid" },
        business_id: { type: "string", format: "uuid" },
        verification_type: { type: "string", maxLength: 50 },
        status: { type: "string", maxLength: 50 },
        verified_by: { type: ["string", "null"], format: "uuid" },
        verified_at: { type: ["string", "null"], format: "date-time" },
        rejection_reason: { type: ["string", "null"] },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
      },
    };
  }

  static get relationMappings() {
    const Business = require("./Business");
    const BusinessUser = require("./BusinessUser");

    return {
      business: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Business,
        join: {
          from: "business_verification.business_id",
          to: "business.id",
        },
      },
      verifier: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: BusinessUser,
        join: {
          from: "business_verification.verified_by",
          to: "business_user.id",
        },
      },
    };
  }

  /**
   * Find verification records for a business
   * @param {string} businessId - Business ID
   * @param {string} verificationType - Type of verification to find (optional)
   * @returns {Promise<Array>} Verification records
   */
  static async findByBusiness(businessId, verificationType = null) {
    const query = this.query()
      .where("business_id", businessId)
      .withGraphFetched("verifier");

    if (verificationType) {
      query.where("verification_type", verificationType);
    }

    return query;
  }

  /**
   * Create or update a verification record
   * @param {string} businessId - Business ID
   * @param {string} verificationType - Type of verification
   * @param {string} status - Verification status
   * @param {Object} data - Additional verification data
   * @returns {Promise<Object>} Created or updated verification record
   */
  static async createOrUpdate(businessId, verificationType, status, data = {}) {
    const existing = await this.query()
      .where({
        business_id: businessId,
        verification_type: verificationType,
      })
      .first();

    if (existing) {
      // Update existing record
      return this.query().patchAndFetchById(existing.id, {
        status,
        verified_by: data.verified_by || null,
        verified_at: data.verified_at || null,
        rejection_reason: data.rejection_reason || null,
        updated_at: new Date().toISOString(),
      });
    } else {
      // Create new record
      return this.query().insert({
        business_id: businessId,
        verification_type: verificationType,
        status,
        verified_by: data.verified_by || null,
        verified_at: data.verified_at || null,
        rejection_reason: data.rejection_reason || null,
      });
    }
  }
}

module.exports = BusinessVerification;
