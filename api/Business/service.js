// api/Business/service.js
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
    // Clean up uploaded file if there was an error
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    logger.error(`Error updating business profile image: ${error.message}`);
    throw error;
  }
};

/**
 * Get KYC information for business
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} KYC information
 */
const getKycInformation = async (businessId) => {
  try {
    const business = await Business.query()
      .findById(businessId)
      .select("kyc")
      .throwIfNotFound();

    return business.kyc || {};
  } catch (error) {
    logger.error(`Error getting KYC information: ${error.message}`);
    throw error;
  }
};

/**
 * Update KYC information for business
 * @param {string} businessId - Business ID
 * @param {Object} kycData - Updated KYC data
 * @returns {Promise<Object>} Updated KYC information
 */
const updateKycInformation = async (businessId, kycData) => {
  const trx = await transaction.start(Business.knex());

  try {
    // Get current business data
    const business = await Business.query(trx).findById(businessId);
    if (!business) {
      throw boom.notFound("Business not found");
    }

    // Prepare KYC data with verification status
    const updatedKyc = {
      ...business.kyc,
      ...kycData,
      verification_status: "pending_verification",
      last_updated: new Date().toISOString(),
    };

    // Update business KYC data
    const updatedBusiness = await Business.query(trx)
      .patchAndFetchById(businessId, {
        kyc: updatedKyc,
        updated_at: new Date().toISOString(),
      })
      .throwIfNotFound();

    // Create or update verification record
    let verificationType = "kyc_general";

    // Determine more specific verification type if available
    if (kycData.gst_number) {
      verificationType = "kyc_gst";
    } else if (kycData.pan_number) {
      verificationType = "kyc_pan";
    } else if (kycData.bank_details) {
      verificationType = "kyc_bank";
    }

    await BusinessVerification.query(trx)
      .insert({
        business_id: businessId,
        verification_type: verificationType,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .onConflict(["business_id", "verification_type"])
      .merge({
        status: "pending",
        updated_at: new Date().toISOString(),
        verified_by: null,
        verified_at: null,
        rejection_reason: null,
      });

    await trx.commit();

    return updatedBusiness.kyc;
  } catch (error) {
    await trx.rollback();
    logger.error(`Error updating KYC information: ${error.message}`);
    throw error;
  }
};

/**
 * Upload business document
 * @param {string} businessId - Business ID
 * @param {string} userId - User ID who uploaded the document
 * @param {Object} documentData - Document metadata
 * @param {Object} file - Uploaded file data
 * @returns {Promise<Object>} Document information
 */
const uploadBusinessDocument = async (
  businessId,
  userId,
  documentData,
  file
) => {
  const trx = await transaction.start(Document.knex());

  try {
    // Validate file
    if (!file || !file.mimetype) {
      throw boom.badRequest("Invalid file");
    }

    // Create document record
    const document = await Document.query(trx).insert({
      business_id: businessId,
      uploaded_by: userId,
      file_name: file.filename,
      file_type: file.mimetype,
      file_size: file.size,
      file_path: file.path,
      document_type: documentData.document_type || "general",
      description: documentData.description || null,
      status: "active",
      verification_status: "pending",
      metadata: {
        original_name: file.originalname,
        uploaded_at: new Date().toISOString(),
      },
    });

    // Create verification record for document
    let verificationType =
      "document_" + (documentData.document_type || "general");

    await BusinessVerification.query(trx)
      .insert({
        business_id: businessId,
        verification_type: verificationType,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .onConflict(["business_id", "verification_type"])
      .merge({
        status: "pending",
        updated_at: new Date().toISOString(),
      });

    await trx.commit();

    return document;
  } catch (error) {
    await trx.rollback();

    // Clean up uploaded file if there was an error
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    logger.error(`Error uploading business document: ${error.message}`);
    throw error;
  }
};

/**
 * Get business documents
 * @param {string} businessId - Business ID
 * @param {string} documentType - Document type for filtering
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated documents
 */
const getBusinessDocuments = async (businessId, documentType, page, limit) => {
  try {
    return await Document.findByBusinessId(
      businessId,
      documentType,
      page,
      limit
    );
  } catch (error) {
    logger.error(`Error getting business documents: ${error.message}`);
    throw error;
  }
};

/**
 * Get specific business document
 * @param {string} businessId - Business ID
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} Document information
 */
const getBusinessDocumentById = async (businessId, documentId) => {
  try {
    return await Document.findByIdAndBusinessId(documentId, businessId);
  } catch (error) {
    logger.error(`Error getting business document by ID: ${error.message}`);
    throw error;
  }
};

/**
 * Update business document
 * @param {string} businessId - Business ID
 * @param {string} documentId - Document ID
 * @param {Object} documentData - Updated document data
 * @returns {Promise<Object>} Updated document information
 */
const updateBusinessDocument = async (businessId, documentId, documentData) => {
  try {
    // Fields that can be updated
    const allowedFields = [
      "description",
      "document_type",
      "status",
      "metadata",
    ];

    // Filter out non-allowed fields
    const filteredData = Object.keys(documentData)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = documentData[key];
        return obj;
      }, {});

    // Add updated_at timestamp
    filteredData.updated_at = new Date().toISOString();

    // Update document in database
    const updatedDocument = await Document.query()
      .patchAndFetchById(documentId, filteredData)
      .where("business_id", businessId)
      .throwIfNotFound();

    return updatedDocument;
  } catch (error) {
    logger.error(`Error updating business document: ${error.message}`);
    throw error;
  }
};

/**
 * Delete business document
 * @param {string} businessId - Business ID
 * @param {string} documentId - Document ID
 * @returns {Promise<void>}
 */
const deleteBusinessDocument = async (businessId, documentId) => {
  const trx = await transaction.start(Document.knex());

  try {
    // Get document details first
    const document = await Document.query(trx)
      .findById(documentId)
      .where("business_id", businessId)
      .throwIfNotFound();

    // Delete document record from database
    await Document.query(trx)
      .deleteById(documentId)
      .where("business_id", businessId)
      .throwIfNotFound();

    await trx.commit();

    // Delete file from storage
    if (document.file_path && fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }
  } catch (error) {
    await trx.rollback();
    logger.error(`Error deleting business document: ${error.message}`);
    throw error;
  }
};

/**
 * Get document file for download
 * @param {string} businessId - Business ID
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} File information for download
 */
const getDocumentFile = async (businessId, documentId) => {
  try {
    const document = await Document.query()
      .findById(documentId)
      .where("business_id", businessId)
      .throwIfNotFound();

    // Check if file exists
    if (!document.file_path || !fs.existsSync(document.file_path)) {
      throw boom.notFound("Document file not found");
    }

    return {
      filePath: document.file_path,
      fileName: document.metadata?.original_name || document.file_name,
      fileType: document.file_type,
    };
  } catch (error) {
    logger.error(`Error getting document file: ${error.message}`);
    throw error;
  }
};

/**
 * Get verification status for business
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Verification status for all verification types
 */
const getBusinessVerificationStatus = async (businessId) => {
  try {
    // Get all verification records for the business
    const verifications = await BusinessVerification.query()
      .where("business_id", businessId)
      .withGraphFetched("verifier");

    // Group by verification type
    const verificationStatus = {};

    verifications.forEach((verification) => {
      verificationStatus[verification.verification_type] = {
        status: verification.status,
        lastUpdated: verification.updated_at,
        verifiedAt: verification.verified_at || null,
        verifiedBy: verification.verifier
          ? {
              id: verification.verifier.id,
              name: `${verification.verifier.first_name} ${verification.verifier.last_name}`,
              email: verification.verifier.email,
            }
          : null,
        rejectionReason: verification.rejection_reason || null,
      };
    });

    return verificationStatus;
  } catch (error) {
    logger.error(
      `Error getting business verification status: ${error.message}`
    );
    throw error;
  }
};

module.exports = {
  getBusinessProfile,
  updateBusinessProfile,
  updateBusinessProfileImage,
  getKycInformation,
  updateKycInformation,
  uploadBusinessDocument,
  getBusinessDocuments,
  getBusinessDocumentById,
  updateBusinessDocument,
  deleteBusinessDocument,
  getDocumentFile,
  getBusinessVerificationStatus,
};
