const path = require("path");
const fs = require("fs");
const boom = require("@hapi/boom");
const logger = require("../../system/utils/logger");
const Business = require("../../system/models/Business");
const Document = require("../../system/models/BusinessDocument");
const BusinessVerification = require("../../system/models/BusinessVerification");
const { transaction } = require("objection");

/**
 * Get business profile
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Business profile
 */
const getBusinessProfile = async (businessId) => {
  try {
    const business = await Business.query().findById(businessId);
    if (!business) {
      throw boom.notFound("Business not found");
    }
    return business;
  } catch (error) {
    logger.error(`Error getting business profile: ${error.message}`);
    throw error;
  }
};

/**
 * Update business profile
 * @param {string} businessId - Business ID
 * @param {Object} businessData - Updated business data
 * @returns {Promise<Object>} Updated business profile
 */
const updateBusinessProfile = async (businessId, businessData) => {
  try {
    // Fields that can be updated
    const allowedFields = [
      "name",
      "description",
      "website",
      "industry",
      "contact_info",
      "settings",
    ];

    // Filter out non-allowed fields
    const filteredData = Object.keys(businessData)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = businessData[key];
        return obj;
      }, {});

    // Add updated_at timestamp
    filteredData.updated_at = new Date().toISOString();

    // Update business in database
    const updatedBusiness = await Business.query()
      .patchAndFetchById(businessId, filteredData)
      .throwIfNotFound();

    return updatedBusiness;
  } catch (error) {
    logger.error(`Error updating business profile: ${error.message}`);
    throw error;
  }
};

/**
 * Update business profile image
 * @param {string} businessId - Business ID
 * @param {Object} file - Uploaded file data
 * @returns {Promise<Object>} Updated profile image URL
 */
const updateBusinessProfileImage = async (businessId, file) => {
  try {
    // Validate file
    if (!file || !file.mimetype) {
      throw boom.badRequest("Invalid file");
    }

    // Check if file is an image
    if (!file.mimetype.startsWith("image/")) {
      throw boom.badRequest("File must be an image");
    }

    // Create relative path for profile image
    const profileImagesPath = "profiles";
    const relativePath = path.join(profileImagesPath, file.filename);

    // Update business profile with new image path
    const updatedBusiness = await Business.query()
      .patchAndFetchById(businessId, {
        profile_image: `/storage/${relativePath}`,
        updated_at: new Date().toISOString(),
      })
      .throwIfNotFound();

    return {
      profile_image: updatedBusiness.profile_image,
    };
  } catch (error) {
    logger.error(`Error updating business profile image: ${error.message}`);
    throw error;
  }
};

/**
 * Get KYC information
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} KYC information
 */
const getKycInformation = async (businessId) => {
  try {
    const verification = await BusinessVerification.query()
      .where("business_id", businessId)
      .first();

    return verification || {};
  } catch (error) {
    logger.error(`Error getting KYC information: ${error.message}`);
    throw error;
  }
};

/**
 * Update KYC information
 * @param {string} businessId - Business ID
 * @param {Object} kycData - KYC data
 * @returns {Promise<Object>} Updated KYC information
 */
const updateKycInformation = async (businessId, kycData) => {
  try {
    const allowedFields = [
      "business_registration_number",
      "tax_identification_number",
      "verification_documents",
      "verification_status",
      "verified_at",
      "verification_notes",
    ];

    // Filter data
    const filteredData = Object.keys(kycData)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = kycData[key];
        return obj;
      }, {});

    filteredData.updated_at = new Date().toISOString();

    // Check if verification record exists
    const existingVerification = await BusinessVerification.query()
      .where("business_id", businessId)
      .first();

    let updatedVerification;
    if (existingVerification) {
      updatedVerification = await BusinessVerification.query()
        .patchAndFetchById(existingVerification.id, filteredData);
    } else {
      updatedVerification = await BusinessVerification.query().insert({
        business_id: businessId,
        ...filteredData,
        created_at: new Date().toISOString(),
      });
    }

    return updatedVerification;
  } catch (error) {
    logger.error(`Error updating KYC information: ${error.message}`);
    throw error;
  }
};

/**
 * Complete business onboarding
 * @param {string} businessId - Business ID
 * @param {Object} onboardingData - Onboarding completion data
 * @returns {Promise<Object>} Updated business with onboarding status
 */
const completeBusinessOnboarding = async (businessId, onboardingData) => {
  try {
    const updatedBusiness = await Business.query()
      .patchAndFetchById(businessId, {
        is_onboarded: true,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...onboardingData,
      })
      .throwIfNotFound();

    return updatedBusiness;
  } catch (error) {
    logger.error(`Error completing business onboarding: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getBusinessProfile,
  updateBusinessProfile,
  updateBusinessProfileImage,
  getKycInformation,
  updateKycInformation,
  completeBusinessOnboarding,
};