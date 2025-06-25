const boom = require("@hapi/boom");
const contactsService = require("./service");
const logger = require("../../system/utils/logger");

/**
 * Create a new contact
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const createContact = async (req) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId;
    const contactData = {
      ...req.body,
      created_by: userId,
    };

    const contact = await contactsService.createContact(
      businessId,
      contactData
    );

    return {
      success: true,
      message: "Contact created successfully",
      data: contact,
    };
  } catch (error) {
    logger.error("Create contact error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to create contact");
  }
};

/**
 * Get a contact by ID
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const getContactById = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { contactId } = req.params;

    const contact = await contactsService.getContactById(contactId, businessId);

    return {
      success: true,
      data: contact,
    };
  } catch (error) {
    logger.error("Get contact by ID error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get contact");
  }
};

/**
 * Get contacts with pagination and filters
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const getContacts = async (req) => {
  try {
    const businessId = req.user.businessId;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search,
      group_id: req.query.group_id,
      sort_by: req.query.sort_by || "created_at",
      sort_order: req.query.sort_order || "desc",
    };

    const result = await contactsService.getContacts(businessId, filters);

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    logger.error("Get contacts error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get contacts");
  }
};

/**
 * Update a contact
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const updateContact = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { contactId } = req.params;
    const contactData = req.body;

    const updatedContact = await contactsService.updateContact(
      contactId,
      businessId,
      contactData
    );

    return {
      success: true,
      message: "Contact updated successfully",
      data: updatedContact,
    };
  } catch (error) {
    logger.error("Update contact error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to update contact");
  }
};

/**
 * Delete a contact
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const deleteContact = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { contactId } = req.params;

    await contactsService.deleteContact(contactId, businessId);

    return {
      success: true,
      message: "Contact deleted successfully",
    };
  } catch (error) {
    logger.error("Delete contact error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to delete contact");
  }
};

/**
 * Create a new contact group
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const createContactGroup = async (req) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId;
    const groupData = req.body;

    const group = await contactsService.createContactGroup(
      businessId,
      userId,
      groupData
    );

    return {
      success: true,
      message: "Contact group created successfully",
      data: group,
    };
  } catch (error) {
    logger.error("Create contact group error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to create contact group");
  }
};

/**
 * Get a contact group by ID
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const getContactGroupById = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { groupId } = req.params;

    const group = await contactsService.getContactGroupById(
      groupId,
      businessId
    );

    return {
      success: true,
      data: group,
    };
  } catch (error) {
    logger.error("Get contact group by ID error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get contact group");
  }
};

/**
 * Get contact groups with pagination and filters
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const getContactGroups = async (req) => {
  try {
    const businessId = req.user.businessId;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search,
      sort_by: req.query.sort_by || "created_at",
      sort_order: req.query.sort_order || "desc",
    };

    const result = await contactsService.getContactGroups(businessId, filters);

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    logger.error("Get contact groups error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get contact groups");
  }
};

/**
 * Update a contact group
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const updateContactGroup = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { groupId } = req.params;
    const groupData = req.body;

    const updatedGroup = await contactsService.updateContactGroup(
      groupId,
      businessId,
      groupData
    );

    return {
      success: true,
      message: "Contact group updated successfully",
      data: updatedGroup,
    };
  } catch (error) {
    logger.error("Update contact group error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to update contact group");
  }
};

/**
 * Delete a contact group
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const deleteContactGroup = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { groupId } = req.params;

    await contactsService.deleteContactGroup(groupId, businessId);

    return {
      success: true,
      message: "Contact group deleted successfully",
    };
  } catch (error) {
    logger.error("Delete contact group error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to delete contact group");
  }
};

/**
 * Add contact to a group
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const addContactToGroup = async (req) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId;
    const { contactId, groupId } = req.params;
    const options = req.body || {}; // Get field_values if provided

    await contactsService.addContactToGroup(
      contactId,
      groupId,
      businessId,
      userId,
      options
    );

    return {
      success: true,
      message: "Contact added to group successfully",
      data: {
        contact_id: contactId,
        group_id: groupId,
        field_values: options.field_values || {},
      },
    };
  } catch (error) {
    logger.error("Add contact to group error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to add contact to group");
  }
};

/**
 * Remove contact from a group
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const removeContactFromGroup = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { contactId, groupId } = req.params;

    await contactsService.removeContactFromGroup(
      contactId,
      groupId,
      businessId
    );

    return {
      success: true,
      message: "Contact removed from group successfully",
    };
  } catch (error) {
    logger.error("Remove contact from group error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to remove contact from group");
  }
};

/**
 * Bulk upload contacts
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const bulkUploadContacts = async (req) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId;

    const uploadData = {
      ...req.body,
      file: req.file,
    };

    const result = await contactsService.uploadContacts(
      uploadData,
      businessId,
      userId
    );

    return {
      success: true,
      message: "Contact upload initiated successfully",
      data: {
        upload_id: result.id,
        status: result.status,
        total_records: result.total_records || 0,
        accepted_records: result.accepted_records || 0,
        rejected_records: result.rejected_records || 0,
        status_url: result.status_url,
      },
    };
  } catch (error) {
    logger.error("Bulk upload contacts error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to upload contacts");
  }
};

/**
 * Get upload status
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const getUploadStatus = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { uploadId } = req.params;

    const status = await contactsService.getUploadStatus(uploadId, businessId);

    return {
      success: true,
      data: status,
    };
  } catch (error) {
    logger.error("Get upload status error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get upload status");
  }
};

/**
 * Download error report
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<void>}
 */
const downloadErrorReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { uploadId } = req.params;

    const report = await contactsService.generateErrorReport(
      uploadId,
      businessId
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${report.filename}"`
    );

    return res.send(report.content);
  } catch (error) {
    logger.error("Download error report error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to download error report");
  }
};

/**
 * Get all contact uploads
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const getContactUploads = async (req) => {
  try {
    const businessId = req.user.businessId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await contactsService.getContactUploads(
      businessId,
      page,
      limit
    );

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    logger.error("Get contact uploads error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get contact uploads");
  }
};

/**
 * Create a new contact group field
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const createContactGroupField = async (req) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId;
    const { groupId } = req.params;
    const fieldData = req.body;

    const field = await contactsService.createContactGroupField(
      groupId,
      businessId,
      userId,
      fieldData
    );

    return {
      success: true,
      message: "Contact group field created successfully",
      data: field,
    };
  } catch (error) {
    logger.error("Create contact group field error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to create contact group field");
  }
};

/**
 * Get contact group fields
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const getContactGroupFields = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { groupId } = req.params;

    const fields = await contactsService.getContactGroupFields(
      groupId,
      businessId
    );

    return {
      success: true,
      data: fields,
    };
  } catch (error) {
    logger.error("Get contact group fields error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get contact group fields");
  }
};

/**
 * Get a contact group field by ID
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const getContactGroupFieldById = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { groupId, fieldId } = req.params;

    const field = await contactsService.getContactGroupFieldById(
      fieldId,
      groupId,
      businessId
    );

    return {
      success: true,
      data: field,
    };
  } catch (error) {
    logger.error("Get contact group field by ID error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get contact group field");
  }
};

/**
 * Update a contact group field
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const updateContactGroupField = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { groupId, fieldId } = req.params;
    const fieldData = req.body;

    const updatedField = await contactsService.updateContactGroupField(
      fieldId,
      groupId,
      businessId,
      fieldData
    );

    return {
      success: true,
      message: "Contact group field updated successfully",
      data: updatedField,
    };
  } catch (error) {
    logger.error("Update contact group field error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to update contact group field");
  }
};

/**
 * Delete a contact group field
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const deleteContactGroupField = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { groupId, fieldId } = req.params;

    await contactsService.deleteContactGroupField(fieldId, groupId, businessId);

    return {
      success: true,
      message: "Contact group field deleted successfully",
    };
  } catch (error) {
    logger.error("Delete contact group field error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to delete contact group field");
  }
};

/**
 * Update field values for a contact in a group
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const updateContactFieldValues = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { contactId, groupId } = req.params;
    const { field_values } = req.body;

    const result = await contactsService.updateContactFieldValues(
      contactId,
      groupId,
      businessId,
      field_values
    );

    return {
      success: true,
      message: "Contact field values updated successfully",
      data: result,
    };
  } catch (error) {
    logger.error("Update contact field values error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to update contact field values");
  }
};

/**
 * Update channel identifiers for a contact
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const updateChannelIdentifiers = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { contactId } = req.params;
    const { channel_identifiers } = req.body;

    const updatedContact = await contactsService.updateChannelIdentifiers(
      contactId,
      businessId,
      channel_identifiers
    );

    return {
      success: true,
      message: "Channel identifiers updated successfully",
      data: {
        id: updatedContact.id,
        channel_identifiers: updatedContact.channel_identifiers,
      },
    };
  } catch (error) {
    logger.error("Update channel identifiers error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to update channel identifiers");
  }
};

/**
 * Update preferences for a contact
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const updatePreferences = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { contactId } = req.params;
    const { preferences } = req.body;

    const updatedContact = await contactsService.updatePreferences(
      contactId,
      businessId,
      preferences
    );

    return {
      success: true,
      message: "Preferences updated successfully",
      data: {
        id: updatedContact.id,
        preferences: updatedContact.preferences,
      },
    };
  } catch (error) {
    logger.error("Update preferences error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to update preferences");
  }
};

/**
 * Validate field values against field definitions
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Response object
 */
const validateFieldValues = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { groupId } = req.params;
    const { field_values } = req.body;

    const validationResult = await contactsService.validateFieldValues(
      groupId,
      businessId,
      field_values
    );

    return {
      success: true,
      data: validationResult,
    };
  } catch (error) {
    logger.error("Validate field values error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to validate field values");
  }
};

module.exports = {
  createContact,
  getContactById,
  getContacts,
  updateContact,
  deleteContact,
  createContactGroup,
  getContactGroupById,
  getContactGroups,
  updateContactGroup,
  deleteContactGroup,
  addContactToGroup,
  removeContactFromGroup,
  bulkUploadContacts,
  getUploadStatus,
  downloadErrorReport,
  getContactUploads,
  createContactGroupField,
  getContactGroupFields,
  getContactGroupFieldById,
  updateContactGroupField,
  deleteContactGroupField,
  updateContactFieldValues,
  updateChannelIdentifiers,
  updatePreferences,
  validateFieldValues,
};
