const boom = require("@hapi/boom");
const businessService = require("../services/businessService");
const logger = require("../../system/utils/logger");

// Get business profile
const getBusinessProfile = async (userId, businessId) => {
  try {
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
const updateBusinessProfile = async (userId, businessId, businessData) => {
  try {
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
const updateBusinessProfileImage = async (userId, businessId, file) => {
  try {
    if (!file) {
      throw boom.badRequest("No file uploaded");
    }

    const result = await businessService.updateBusinessProfileImage(
      businessId,
      file
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
const getKycInformation = async (userId, businessId) => {
  try {
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
const updateKycInformation = async (userId, businessId, kycData) => {
  try {
    const result = await businessService.updateKycInformation(businessId, kycData);

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

// Complete business onboarding
const completeBusinessOnboarding = async (userId, businessId, onboardingData) => {
  try {
    const result = await businessService.completeBusinessOnboarding(
      businessId,
      onboardingData
    );

    return {
      success: true,
      message: "Business onboarding completed successfully",
      data: result,
    };
  } catch (error) {
    logger.error("Complete business onboarding error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to complete business onboarding");
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