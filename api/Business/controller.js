// api/Business/controller.js
const boom = require("@hapi/boom");
const businessService = require("./service");
const logger = require("../../system/utils/logger");

// Get business profile
const getBusinessProfile = async (req) => {
  try {
    const businessId = req.user.businessId;

    const result = await businessService.getBusinessProfile(businessId);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("Get business profile error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get business profile");
  }
};

// Update business profile
const updateBusinessProfile = async (req) => {
  try {
    const businessId = req.user.businessId;
    const businessData = req.body;

    const result = await businessService.updateBusinessProfile(
      businessId,
      businessData
    );

    return {
      success: true,
      message: "Business profile updated successfully",
      data: result,
    };
  } catch (error) {
    logger.error("Update business profile error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to update business profile");
  }
};

// Update business profile image
const updateBusinessProfileImage = async (req) => {
  try {
    const businessId = req.user.businessId;

    if (!req.file) {
      throw boom.badRequest("No file uploaded");
    }

    const result = await businessService.updateBusinessProfileImage(
      businessId,
      req.file
    );

    return {
      success: true,
      message: "Profile image updated successfully",
      data: result,
    };
  } catch (error) {
    logger.error("Update business profile image error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to update business profile image");
  }
};

// Get KYC information
const getKycInformation = async (req) => {
  try {
    const businessId = req.user.businessId;

    const result = await businessService.getKycInformation(businessId);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("Get KYC information error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get KYC information");
  }
};

// Update KYC information
const updateKycInformation = async (req) => {
  try {
    const businessId = req.user.businessId;
    const kycData = req.body;

    const result = await businessService.updateKycInformation(
      businessId,
      kycData
    );

    return {
      success: true,
      message: "KYC information updated successfully",
      data: result,
    };
  } catch (error) {
    logger.error("Update KYC information error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to update KYC information");
  }
};

// Upload business document
const uploadBusinessDocument = async (req) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId;

    if (!req.file) {
      throw boom.badRequest("No file uploaded");
    }

    const documentData = {
      document_type: req.body.document_type,
      description: req.body.description,
    };

    const result = await businessService.uploadBusinessDocument(
      businessId,
      userId,
      documentData,
      req.file
    );

    return {
      success: true,
      message: "Document uploaded successfully",
      data: result,
    };
  } catch (error) {
    logger.error("Upload business document error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to upload business document");
  }
};

// Get business documents
const getBusinessDocuments = async (req) => {
  try {
    const businessId = req.user.businessId;
    const documentType = req.query.document_type;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await businessService.getBusinessDocuments(
      businessId,
      documentType,
      page,
      limit
    );

    return {
      success: true,
      data: result.data,
      total: result.total,
      page,
      limit,
    };
  } catch (error) {
    logger.error("Get business documents error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get business documents");
  }
};

// Get specific business document
const getBusinessDocumentById = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { document_id } = req.params;

    const result = await businessService.getBusinessDocumentById(
      businessId,
      document_id
    );

    if (!result) {
      throw boom.notFound("Document not found");
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("Get business document by ID error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get business document");
  }
};

// Update business document
const updateBusinessDocument = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { document_id } = req.params;
    const documentData = req.body;

    const documentExists = await businessService.getBusinessDocumentById(
      businessId,
      document_id
    );

    if (!documentExists) {
      throw boom.notFound("Document not found");
    }

    const result = await businessService.updateBusinessDocument(
      businessId,
      document_id,
      documentData
    );

    return {
      success: true,
      message: "Document updated successfully",
      data: result,
    };
  } catch (error) {
    logger.error("Update business document error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to update business document");
  }
};

// Delete business document
const deleteBusinessDocument = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { document_id } = req.params;

    const documentExists = await businessService.getBusinessDocumentById(
      businessId,
      document_id
    );

    if (!documentExists) {
      throw boom.notFound("Document not found");
    }

    await businessService.deleteBusinessDocument(businessId, document_id);

    return {
      success: true,
      message: "Document deleted successfully",
    };
  } catch (error) {
    logger.error("Delete business document error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to delete business document");
  }
};

// Download business document
const downloadBusinessDocument = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { document_id } = req.params;

    const documentExists = await businessService.getBusinessDocumentById(
      businessId,
      document_id
    );

    if (!documentExists) {
      throw boom.notFound("Document not found");
    }

    const { filePath, fileName, fileType } =
      await businessService.getDocumentFile(businessId, document_id);

    res.setHeader("Content-Type", fileType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.sendFile(filePath);
  } catch (error) {
    logger.error("Download business document error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to download business document");
  }
};

// Get business verification status
const getBusinessVerificationStatus = async (req) => {
  try {
    const businessId = req.user.businessId;

    const result = await businessService.getBusinessVerificationStatus(
      businessId
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("Get business verification status error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get business verification status");
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
  downloadBusinessDocument,
  getBusinessVerificationStatus,
};
