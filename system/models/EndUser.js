// system/models/EndUser.js
const BaseModel = require("./BaseModel");
const { ref } = require("objection");
const { createPhoneQueryVariations } = require("../utils/phoneNormalization");

class EndUser extends BaseModel {
  static get tableName() {
    return "end_user";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["business_id"],
      properties: {
        id: { type: "string", format: "uuid" },
        business_id: { type: "string", format: "uuid" },
        phone: { type: ["string", "null"], maxLength: 50 },
        country_code: { type: ["string", "null"], maxLength: 10 },
        email: {
          type: ["string", "null"],
          format: "email",
          maxLength: 255,
        },
        first_name: { type: ["string", "null"], maxLength: 100 },
        last_name: { type: ["string", "null"], maxLength: 100 },
        source_type: { type: ["string", "null"], maxLength: 50 },
        source_id: { type: ["string", "null"], format: "uuid" },
        channel_identifiers: { type: "object" },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
        preferences: { type: "object" },
        metadata: { type: "object" },
      },
    };
  }

  static get relationMappings() {
    const Business = require("./Business");
    const ContactGroup = require("./ContactGroup");
    const ContactUpload = require("./ContactUpload");

    return {
      business: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Business,
        join: {
          from: "end_user.business_id",
          to: "business.id",
        },
      },
      contactGroups: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: ContactGroup,
        join: {
          from: "end_user.id",
          through: {
            from: "contact_group_association.end_user_id",
            to: "contact_group_association.contact_group_id",
            extra: ["field_values", "created_at", "created_by"],
          },
          to: "contact_group.id",
        },
      },
      source: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: ContactUpload,
        join: {
          from: "end_user.source_id",
          to: "contact_upload.id",
        },
      },
    };
  }

  static async findByBusinessId(businessId, filters = {}) {
    let query = this.query().where("business_id", businessId);

    // Apply filters
    if (filters.email) {
      query = query.where("email", filters.email);
    }

    if (filters.phone) {
      query = query.where("phone", filters.phone);
    }

    if (filters.name) {
      query = query.where((builder) => {
        builder
          .whereRaw("LOWER(first_name) LIKE ?", [
            `%${filters.name.toLowerCase()}%`,
          ])
          .orWhereRaw("LOWER(last_name) LIKE ?", [
            `%${filters.name.toLowerCase()}%`,
          ]);
      });
    }

    if (filters.source_type) {
      query = query.where("source_type", filters.source_type);
    }

    // This is the fixed part
    if (filters.group_id) {
      query = query.whereExists(function () {
        this.select(1)
          .from("contact_group_association")
          .join(
            "contact_group",
            "contact_group.id",
            "contact_group_association.contact_group_id",
          )
          .where("contact_group_association.end_user_id", ref("end_user.id"))
          .where("contact_group.id", filters.group_id);
      });
    }

    // Search in metadata
    if (filters.metadata_key && filters.metadata_value) {
      query = query.whereRaw("metadata->? = ?", [
        filters.metadata_key,
        JSON.stringify(filters.metadata_value),
      ]);
    }

    // Pagination
    const page = parseInt(filters.page, 10) || 1;
    const perPage = parseInt(filters.limit, 10) || 10;
    const offset = (page - 1) * perPage;

    // Sorting
    const sortBy = filters.sort_by || "created_at";
    const sortOrder =
      filters.sort_order?.toLowerCase() === "asc" ? "asc" : "desc";

    // Get total count for pagination
    const total = await query.clone().resultSize();

    // Apply pagination and sorting
    query = query.orderBy(sortBy, sortOrder).limit(perPage).offset(offset);

    // Fetch results
    const results = await query;

    return {
      contacts: results,
      meta: {
        total,
        page,
        per_page: perPage,
        total_pages: Math.ceil(total / perPage),
      },
    };
  }
  static async findByEmailOrPhone(businessId, email, phoneVariations) {
    return this.query()
      .where("business_id", businessId)
      .where((builder) => {
        if (email) {
          builder.orWhere("email", email);
        }
        if (phoneVariations) {
          // Handle both single phone string and array of phone variations
          if (Array.isArray(phoneVariations)) {
            phoneVariations.forEach((phoneVar) => {
              builder.orWhere("phone", phoneVar);
            });
          } else {
            builder.orWhere("phone", phoneVariations);
          }
        }
      })
      .first();
  }
}

module.exports = EndUser;
