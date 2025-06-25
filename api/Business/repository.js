// api/Business/repository.js (Not used in current implementation)
const Business = require("../../system/models/Business");
const Document = require("../../system/models/BusinessDocument");
const BusinessVerification = require("../../system/models/BusinessVerification");

/**
 * Get business by ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Business object
 */
const getBusinessById = async (businessId) => {
  return await Business.query().findById(businessId);
};

/**
 * Update business
 * @param {string} businessId - Business ID
 * @param {Object} businessData - Business data to update
 * @returns {Promise<Object>} Updated business object
 */
const updateBusiness = async (businessId, businessData) => {
  return await Business.query().patchAndFetchById(businessId, businessData);
};

/**
 * Get document by ID and business ID
 * @param {string} documentId - Document ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Document object
 */
const getDocumentById = async (documentId, businessId) => {
  return await Document.query()
    .findById(documentId)
    .where("business_id", businessId)
    .first();
};

/**
 * Get business documents
 * @param {string} businessId - Business ID
 * @param {string} documentType - Document type filter (optional)
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated documents
 */
const getBusinessDocuments = async (businessId, documentType, page, limit) => {
  const query = Document.query().where("business_id", businessId);

  if (documentType) {
    query.where("document_type", documentType);
  }

  return await query.page(page - 1, limit);
};

/**
 * Create document
 * @param {Object} documentData - Document data
 * @returns {Promise<Object>} Created document
 */
const createDocument = async (documentData) => {
  return await Document.query().insert(documentData);
};

/**
 * Update document
 * @param {string} documentId - Document ID
 * @param {string} businessId - Business ID
 * @param {Object} documentData - Document data to update
 * @returns {Promise<Object>} Updated document
 */
const updateDocument = async (documentId, businessId, documentData) => {
  return await Document.query()
    .patchAndFetchById(documentId, documentData)
    .where("business_id", businessId);
};

/**
 * Delete document
 * @param {string} documentId - Document ID
 * @param {string} businessId - Business ID
 * @returns {Promise<number>} Number of deleted rows
 */
const deleteDocument = async (documentId, businessId) => {
  return await Document.query()
    .deleteById(documentId)
    .where("business_id", businessId);
};

/**
 * Get verification records for business
 * @param {string} businessId - Business ID
 * @returns {Promise<Array>} Array of verification records
 */
const getVerificationRecords = async (businessId) => {
  return await BusinessVerification.query()
    .where("business_id", businessId)
    .withGraphFetched("verifier");
};

/**
 * Create or update verification record
 * @param {Object} verificationData - Verification data
 * @returns {Promise<Object>} Created or updated verification record
 */
const createOrUpdateVerification = async (verificationData) => {
  return await BusinessVerification.query()
    .insert(verificationData)
    .onConflict(["business_id", "verification_type"])
    .merge();
};

module.exports = {
  getBusinessById,
  updateBusiness,
  getDocumentById,
  getBusinessDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  getVerificationRecords,
  createOrUpdateVerification,
};
