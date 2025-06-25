// api/Business/schema.js
const Joi = require("joi");

// Schema for updating business profile
const updateBusinessProfileSchema = Joi.object({
  name: Joi.string().max(255),
  description: Joi.string().allow(null, ""),
  website: Joi.string().uri().allow(null, ""),
  industry: Joi.string().max(100).allow(null, ""),
  contact_info: Joi.object({
    email: Joi.string().email().allow(null, ""),
    phone: Joi.string().max(50).allow(null, ""),
    address: Joi.object({
      line1: Joi.string().max(255).allow(null, ""),
      line2: Joi.string().max(255).allow(null, ""),
      city: Joi.string().max(100).allow(null, ""),
      state: Joi.string().max(100).allow(null, ""),
      postal_code: Joi.string().max(20).allow(null, ""),
      country: Joi.string().max(100).allow(null, ""),
    }).allow(null),
  }).allow(null),
  settings: Joi.object().allow(null),
}).min(1);

// Schema for updating KYC information
const updateKycSchema = Joi.object({
  gst_number: Joi.string()
    .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/)
    .messages({
      "string.pattern.base":
        "GST number must be in valid format (e.g., 27AAPFU0939F1ZV)",
    }),
  pan_number: Joi.string()
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .messages({
      "string.pattern.base":
        "PAN number must be in valid format (e.g., ABCDE1234F)",
    }),
  business_type: Joi.string().valid(
    "sole_proprietorship",
    "partnership",
    "llp",
    "private_limited",
    "public_limited",
    "other"
  ),
  registration_number: Joi.string().max(100).allow(null, ""),
  tax_details: Joi.object({
    tax_id: Joi.string().max(100).allow(null, ""),
    tax_type: Joi.string().max(100).allow(null, ""),
  }).allow(null),
  bank_details: Joi.object({
    account_number: Joi.string().max(100).allow(null, ""),
    ifsc_code: Joi.string()
      .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
      .allow(null, "")
      .messages({
        "string.pattern.base":
          "IFSC code must be in valid format (e.g., SBIN0001234)",
      }),
    bank_name: Joi.string().max(100).allow(null, ""),
    branch: Joi.string().max(100).allow(null, ""),
    account_type: Joi.string().valid("savings", "current").allow(null, ""),
  }).allow(null),
}).min(1);

// Schema for uploading a document
const uploadDocumentSchema = Joi.object({
  document_type: Joi.string()
    .valid(
      "gst_certificate",
      "pan_card",
      "business_registration",
      "bank_statement",
      "address_proof",
      "identity_proof",
      "other"
    )
    .required(),
  description: Joi.string().max(500).allow(null, ""),
});

// Schema for updating a document
const updateDocumentSchema = Joi.object({
  document_type: Joi.string().valid(
    "gst_certificate",
    "pan_card",
    "business_registration",
    "bank_statement",
    "address_proof",
    "identity_proof",
    "other"
  ),
  description: Joi.string().max(500).allow(null, ""),
  status: Joi.string().valid("active", "inactive", "archived"),
  metadata: Joi.object().allow(null),
}).min(1);

module.exports = {
  updateBusinessProfileSchema,
  updateKycSchema,
  uploadDocumentSchema,
  updateDocumentSchema,
};
