const EndUser = require("../../system/models/EndUser");
const ContactGroup = require("../../system/models/ContactGroup");
const ContactUpload = require("../../system/models/ContactUpload");
const ContactGroupField = require("../../system/models/ContactGroupField");
const { transaction } = require("objection");
const logger = require("../../system/utils/logger");

/**
 * Repository for database operations related to contacts
 */

/**
 * Create a new contact
 * @param {Object} contactData - Contact data
 * @returns {Promise<Object>} Created contact
 */
const createContact = async (contactData) => {
  try {
    return await EndUser.query().insert(contactData);
  } catch (error) {
    logger.error("Error creating contact:", error);
    throw error;
  }
};

/**
 * Get contact by ID and business ID
 * @param {string} contactId - Contact ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Contact object
 */
const getContactById = async (contactId, businessId) => {
  try {
    return await EndUser.query()
      .findById(contactId)
      .where("business_id", businessId)
      .withGraphFetched("contactGroups");
  } catch (error) {
    logger.error(`Error getting contact by ID ${contactId}:`, error);
    throw error;
  }
};

/**
 * Get contacts by business ID with pagination and filters
 * @param {string} businessId - Business ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Paginated contacts
 */
const getContacts = async (businessId, filters = {}) => {
  try {
    return await EndUser.findByBusinessId(businessId, filters);
  } catch (error) {
    logger.error(`Error getting contacts for business ${businessId}:`, error);
    throw error;
  }
};

/**
 * Update a contact
 * @param {string} contactId - Contact ID
 * @param {string} businessId - Business ID
 * @param {Object} contactData - Updated contact data
 * @returns {Promise<Object>} Updated contact
 */
const updateContact = async (contactId, businessId, contactData) => {
  try {
    return await EndUser.query()
      .patchAndFetchById(contactId, contactData)
      .where("business_id", businessId)
      .withGraphFetched("contactGroups");
  } catch (error) {
    logger.error(`Error updating contact ${contactId}:`, error);
    throw error;
  }
};

/**
 * Delete a contact
 * @param {string} contactId - Contact ID
 * @param {string} businessId - Business ID
 * @returns {Promise<number>} Number of deleted rows
 */
const deleteContact = async (contactId, businessId) => {
  try {
    return await EndUser.query()
      .delete()
      .where({ id: contactId, business_id: businessId });
  } catch (error) {
    logger.error(`Error deleting contact ${contactId}:`, error);
    throw error;
  }
};

/**
 * Check if contact with email or phone exists
 * @param {string} businessId - Business ID
 * @param {string} email - Email address
 * @param {string|Array} phoneVariations - Phone number or array of phone variations
 * @returns {Promise<Object>} Existing contact if found
 */
const findContactByEmailOrPhone = async (
  businessId,
  email,
  phoneVariations,
) => {
  try {
    return await EndUser.findByEmailOrPhone(businessId, email, phoneVariations);
  } catch (error) {
    logger.error("Error finding contact by email or phone:", error);
    throw error;
  }
};

/**
 * Get contact group by name and business ID
 * @param {string} businessId - Business ID
 * @param {string} name - Contact group name
 * @returns {Promise<Object>} Contact group object
 */
const getContactGroupByName = async (businessId, name) => {
  try {
    return await ContactGroup.query()
      .where("business_id", businessId)
      .where("name", name)
      .first();
  } catch (error) {
    logger.error(`Error getting contact group by name ${name}:`, error);
    throw error;
  }
};

/**
 * Create a new contact group
 * @param {Object} groupData - Contact group data
 * @returns {Promise<Object>} Created contact group
 */
const createContactGroup = async (groupData) => {
  try {
    return await ContactGroup.query().insert(groupData);
  } catch (error) {
    logger.error("Error creating contact group:", error);
    throw error;
  }
};

/**
 * Get contact group by ID and business ID
 * @param {string} groupId - Contact group ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Contact group object
 */
const getContactGroupById = async (groupId, businessId) => {
  try {
    return await ContactGroup.query()
      .findById(groupId)
      .where("business_id", businessId)
      .withGraphFetched("contacts");
  } catch (error) {
    logger.error(`Error getting contact group by ID ${groupId}:`, error);
    throw error;
  }
};

/**
 * Get contact groups by business ID with pagination and filters
 * @param {string} businessId - Business ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Paginated contact groups
 */
const getContactGroups = async (businessId, filters = {}) => {
  try {
    return await ContactGroup.findByBusinessId(businessId, filters);
  } catch (error) {
    logger.error(
      `Error getting contact groups for business ${businessId}:`,
      error,
    );
    throw error;
  }
};

/**
 * Update a contact group
 * @param {string} groupId - Contact group ID
 * @param {string} businessId - Business ID
 * @param {Object} groupData - Updated contact group data
 * @returns {Promise<Object>} Updated contact group
 */
const updateContactGroup = async (groupId, businessId, groupData) => {
  try {
    return await ContactGroup.query()
      .patchAndFetchById(groupId, groupData)
      .where("business_id", businessId);
  } catch (error) {
    logger.error(`Error updating contact group ${groupId}:`, error);
    throw error;
  }
};

/**
 * Delete a contact group
 * @param {string} groupId - Contact group ID
 * @param {string} businessId - Business ID
 * @returns {Promise<number>} Number of deleted rows
 */
const deleteContactGroup = async (groupId, businessId) => {
  try {
    return await ContactGroup.query()
      .delete()
      .where({ id: groupId, business_id: businessId });
  } catch (error) {
    logger.error(`Error deleting contact group ${groupId}:`, error);
    throw error;
  }
};

/**
 * Add a contact to a group
 * @param {string} contactId - Contact ID
 * @param {string} groupId - Contact group ID
 * @param {string} userId - User ID who performed the action
 * @param {Object} fieldValues - Field values for the contact in this group
 * @returns {Promise<Object>} Association result
 */
const addContactToGroup = async (
  contactId,
  groupId,
  userId = null,
  fieldValues = {},
) => {
  try {
    // Check if association already exists
    const exists = await ContactGroup.relatedQuery("contacts")
      .for(groupId)
      .where("end_user.id", contactId)
      .first();

    if (exists) {
      // If association exists and field values are provided, update them
      if (Object.keys(fieldValues).length > 0) {
        await updateContactFieldValues(contactId, groupId, fieldValues);
      }
      return exists;
    }

    // Create the association with field values
    return await ContactGroup.relatedQuery("contacts").for(groupId).relate({
      id: contactId,
      created_by: userId,
      created_at: new Date().toISOString(),
      field_values: fieldValues,
    });
  } catch (error) {
    logger.error(
      `Error adding contact ${contactId} to group ${groupId}:`,
      error,
    );
    throw error;
  }
};

/**
 * Remove a contact from a group
 * @param {string} contactId - Contact ID
 * @param {string} groupId - Contact group ID
 * @returns {Promise<number>} Number of unrelated rows
 */
const removeContactFromGroup = async (contactId, groupId) => {
  try {
    return await ContactGroup.relatedQuery("contacts")
      .for(groupId)
      .unrelate()
      .where("end_user.id", contactId);
  } catch (error) {
    logger.error(
      `Error removing contact ${contactId} from group ${groupId}:`,
      error,
    );
    throw error;
  }
};

/**
 * Create a contact upload record
 * @param {Object} uploadData - Upload data
 * @returns {Promise<Object>} Created upload record
 */
const createContactUpload = async (uploadData) => {
  try {
    return await ContactUpload.query().insert(uploadData);
  } catch (error) {
    logger.error("Error creating contact upload record:", error);
    throw error;
  }
};

/**
 * Get contact upload by ID
 * @param {string} uploadId - Upload ID
 * @param {string} businessId - Business ID (optional)
 * @returns {Promise<Object>} Upload object
 */
const getContactUploadById = async (uploadId, businessId = null) => {
  try {
    let query = ContactUpload.query().findById(uploadId);

    // Only add the business_id condition if it's provided
    if (businessId) {
      query = query.where("business_id", businessId);
    }

    return await query;
  } catch (error) {
    logger.error(`Error getting contact upload by ID ${uploadId}:`, error);
    throw error;
  }
};

/**
 * Update contact upload status
 * @param {string} uploadId - Upload ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated upload record
 */
const updateContactUpload = async (uploadId, updateData) => {
  try {
    return await ContactUpload.query().patchAndFetchById(uploadId, updateData);
  } catch (error) {
    logger.error(`Error updating contact upload ${uploadId}:`, error);
    throw error;
  }
};

/**
 * Get all contact upload records for a business
 * @param {string} businessId - Business ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of upload records
 */
const getContactUploads = async (businessId, page = 1, limit = 20) => {
  try {
    const query = ContactUpload.query()
      .where("business_id", businessId)
      .orderBy("created_at", "desc");

    const results = await query.page(page - 1, limit);

    return {
      data: results.results,
      total: results.total,
      page,
      limit,
    };
  } catch (error) {
    logger.error(
      `Error getting contact uploads for business ${businessId}:`,
      error,
    );
    throw error;
  }
};

/**
 * Create a new contact group field
 * @param {Object} fieldData - Field data
 * @returns {Promise<Object>} Created field
 */
const createContactGroupField = async (fieldData) => {
  try {
    return await ContactGroupField.query().insert(fieldData);
  } catch (error) {
    logger.error("Error creating contact group field:", error);
    throw error;
  }
};

/**
 * Get contact group fields
 * @param {string} groupId - Contact group ID
 * @returns {Promise<Array>} Array of fields
 */
const getContactGroupFields = async (groupId) => {
  try {
    return await ContactGroupField.query()
      .where("contact_group_id", groupId)
      .orderBy("created_at", "asc");
  } catch (error) {
    logger.error(`Error getting fields for contact group ${groupId}:`, error);
    throw error;
  }
};

/**
 * Get contact group field by ID
 * @param {string} fieldId - Field ID
 * @param {string} groupId - Contact group ID
 * @returns {Promise<Object>} Field object
 */
const getContactGroupFieldById = async (fieldId, groupId) => {
  try {
    return await ContactGroupField.query()
      .findById(fieldId)
      .where("contact_group_id", groupId);
  } catch (error) {
    logger.error(`Error getting field ${fieldId}:`, error);
    throw error;
  }
};

/**
 * Update a contact group field
 * @param {string} fieldId - Field ID
 * @param {string} groupId - Contact group ID
 * @param {Object} fieldData - Updated field data
 * @returns {Promise<Object>} Updated field
 */
const updateContactGroupField = async (fieldId, groupId, fieldData) => {
  try {
    return await ContactGroupField.query()
      .patchAndFetchById(fieldId, fieldData)
      .where("contact_group_id", groupId);
  } catch (error) {
    logger.error(`Error updating field ${fieldId}:`, error);
    throw error;
  }
};

/**
 * Delete a contact group field
 * @param {string} fieldId - Field ID
 * @param {string} groupId - Contact group ID
 * @returns {Promise<number>} Number of deleted rows
 */
const deleteContactGroupField = async (fieldId, groupId) => {
  try {
    return await ContactGroupField.query()
      .delete()
      .where({ id: fieldId, contact_group_id: groupId });
  } catch (error) {
    logger.error(`Error deleting field ${fieldId}:`, error);
    throw error;
  }
};

/**
 * Update field values for a contact in a group
 * @param {string} contactId - Contact ID
 * @param {string} groupId - Contact group ID
 * @param {Object} fieldValues - Field values to update
 * @returns {Promise<Object>} Updated association
 */
const updateContactFieldValues = async (contactId, groupId, fieldValues) => {
  try {
    // Update the field_values in the association
    return await ContactGroup.relatedQuery("contacts")
      .for(groupId)
      .where("end_user.id", contactId)
      .patch({
        field_values: fieldValues,
      });
  } catch (error) {
    logger.error(
      `Error updating field values for contact ${contactId} in group ${groupId}:`,
      error,
    );
    throw error;
  }
};

/**
 * Update channel identifiers for a contact
 * @param {string} contactId - Contact ID
 * @param {string} businessId - Business ID
 * @param {Object} channelIdentifiers - Channel identifiers to update
 * @returns {Promise<Object>} Updated contact
 */
const updateChannelIdentifiers = async (
  contactId,
  businessId,
  channelIdentifiers,
) => {
  try {
    const contact = await EndUser.query()
      .findById(contactId)
      .where("business_id", businessId);

    if (!contact) {
      throw new Error("Contact not found");
    }

    // Merge existing channel identifiers with new ones
    const updatedChannelIdentifiers = {
      ...(contact.channel_identifiers || {}),
      ...channelIdentifiers,
    };

    return await EndUser.query()
      .patchAndFetchById(contactId, {
        channel_identifiers: updatedChannelIdentifiers,
        updated_at: new Date().toISOString(),
      })
      .where("business_id", businessId);
  } catch (error) {
    logger.error(
      `Error updating channel identifiers for contact ${contactId}:`,
      error,
    );
    throw error;
  }
};

/**
 * Update preferences for a contact
 * @param {string} contactId - Contact ID
 * @param {string} businessId - Business ID
 * @param {Object} preferences - Preferences to update
 * @returns {Promise<Object>} Updated contact
 */
const updatePreferences = async (contactId, businessId, preferences) => {
  try {
    const contact = await EndUser.query()
      .findById(contactId)
      .where("business_id", businessId);

    if (!contact) {
      throw new Error("Contact not found");
    }

    // Merge existing preferences with new ones
    const updatedPreferences = {
      ...(contact.preferences || {}),
      ...preferences,
    };

    return await EndUser.query()
      .patchAndFetchById(contactId, {
        preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      })
      .where("business_id", businessId);
  } catch (error) {
    logger.error(`Error updating preferences for contact ${contactId}:`, error);
    throw error;
  }
};

/**
 * Validate field values against field definitions
 * @param {string} groupId - Contact group ID
 * @param {Object} fieldValues - Field values to validate
 * @returns {Promise<Object>} Validation result
 */
const validateFieldValues = async (groupId, fieldValues) => {
  try {
    // Get all field definitions for the group
    const fields = await getContactGroupFields(groupId);

    // Initialize validation results
    const validationResults = {
      isValid: true,
      errors: [],
    };

    // Check for required fields
    for (const field of fields) {
      const fieldName = field.name;
      const fieldValue = fieldValues[fieldName];

      // Check if required field is missing
      if (
        field.is_required &&
        (fieldValue === undefined || fieldValue === null || fieldValue === "")
      ) {
        validationResults.isValid = false;
        validationResults.errors.push({
          field: fieldName,
          message: `${fieldName} is required`,
          rule: "required",
        });
        continue;
      }

      // Skip validation if field is not provided
      if (fieldValue === undefined || fieldValue === null) {
        continue;
      }

      // Validate field value against validation rules
      if (
        field.validation_rules &&
        Object.keys(field.validation_rules).length > 0
      ) {
        const validationRules = field.validation_rules;

        // Validate based on field type
        switch (field.field_type) {
          case "text":
            // Check min length
            if (
              validationRules.min_length !== undefined &&
              fieldValue.length < validationRules.min_length
            ) {
              validationResults.isValid = false;
              validationResults.errors.push({
                field: fieldName,
                value: fieldValue,
                rule: "min_length",
                message: `${fieldName} must be at least ${validationRules.min_length} characters`,
              });
            }

            // Check max length
            if (
              validationRules.max_length !== undefined &&
              fieldValue.length > validationRules.max_length
            ) {
              validationResults.isValid = false;
              validationResults.errors.push({
                field: fieldName,
                value: fieldValue,
                rule: "max_length",
                message: `${fieldName} must be at most ${validationRules.max_length} characters`,
              });
            }

            // Check pattern
            if (
              validationRules.pattern &&
              !new RegExp(validationRules.pattern).test(fieldValue)
            ) {
              validationResults.isValid = false;
              validationResults.errors.push({
                field: fieldName,
                value: fieldValue,
                rule: "pattern",
                message: `${fieldName} does not match the required pattern`,
              });
            }

            // Check allowed values
            if (
              validationRules.allowed_values &&
              !validationRules.allowed_values.includes(fieldValue)
            ) {
              validationResults.isValid = false;
              validationResults.errors.push({
                field: fieldName,
                value: fieldValue,
                rule: "allowed_values",
                message: `${fieldName} must be one of: ${validationRules.allowed_values.join(
                  ", ",
                )}`,
              });
            }
            break;

          case "number":
            const numValue = Number(fieldValue);

            // Check if it's a valid number
            if (isNaN(numValue)) {
              validationResults.isValid = false;
              validationResults.errors.push({
                field: fieldName,
                value: fieldValue,
                rule: "number",
                message: `${fieldName} must be a valid number`,
              });
              break;
            }

            // Check min value
            if (
              validationRules.min !== undefined &&
              numValue < validationRules.min
            ) {
              validationResults.isValid = false;
              validationResults.errors.push({
                field: fieldName,
                value: fieldValue,
                rule: "min",
                message: `${fieldName} must be at least ${validationRules.min}`,
              });
            }

            // Check max value
            if (
              validationRules.max !== undefined &&
              numValue > validationRules.max
            ) {
              validationResults.isValid = false;
              validationResults.errors.push({
                field: fieldName,
                value: fieldValue,
                rule: "max",
                message: `${fieldName} must be at most ${validationRules.max}`,
              });
            }

            // Check integer only
            if (validationRules.integer_only && !Number.isInteger(numValue)) {
              validationResults.isValid = false;
              validationResults.errors.push({
                field: fieldName,
                value: fieldValue,
                rule: "integer_only",
                message: `${fieldName} must be an integer`,
              });
            }
            break;

          case "select":
            // Check if value is in options
            if (
              validationRules.options &&
              !validationRules.options.includes(fieldValue)
            ) {
              validationResults.isValid = false;
              validationResults.errors.push({
                field: fieldName,
                value: fieldValue,
                rule: "options",
                message: `${fieldName} must be one of: ${validationRules.options.join(
                  ", ",
                )}`,
              });
            }
            break;

          case "email":
            // Check email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(fieldValue)) {
              validationResults.isValid = false;
              validationResults.errors.push({
                field: fieldName,
                value: fieldValue,
                rule: "email",
                message: `${fieldName} must be a valid email address`,
              });
            }

            // Check allowed domains
            if (
              validationRules.allowed_domains &&
              validationRules.allowed_domains.length > 0
            ) {
              const domain = fieldValue.split("@")[1];
              if (!validationRules.allowed_domains.includes(domain)) {
                validationResults.isValid = false;
                validationResults.errors.push({
                  field: fieldName,
                  value: fieldValue,
                  rule: "allowed_domains",
                  message: `${fieldName} must be from one of these domains: ${validationRules.allowed_domains.join(
                    ", ",
                  )}`,
                });
              }
            }
            break;

          case "phone":
            // Check phone format
            const phoneRegex = /^\+[1-9]\d{1,14}$/;
            if (!phoneRegex.test(fieldValue)) {
              validationResults.isValid = false;
              validationResults.errors.push({
                field: fieldName,
                value: fieldValue,
                rule: "phone",
                message: `${fieldName} must be a valid phone number in E.164 format`,
              });
            }

            // Check allowed country codes
            if (
              validationRules.allowed_country_codes &&
              validationRules.allowed_country_codes.length > 0
            ) {
              const countryCode = fieldValue.split("+")[1].substring(0, 3); // Extract country code
              const matchedCode = validationRules.allowed_country_codes.find(
                (code) => countryCode.startsWith(code),
              );
              if (!matchedCode) {
                validationResults.isValid = false;
                validationResults.errors.push({
                  field: fieldName,
                  value: fieldValue,
                  rule: "allowed_country_codes",
                  message: `${fieldName} must have one of these country codes: ${validationRules.allowed_country_codes.join(
                    ", ",
                  )}`,
                });
              }
            }
            break;
        }
      }
    }

    return validationResults;
  } catch (error) {
    logger.error(`Error validating field values for group ${groupId}:`, error);
    throw error;
  }
};

module.exports = {
  createContact,
  getContactById,
  getContacts,
  updateContact,
  deleteContact,
  findContactByEmailOrPhone,
  createContactGroup,
  getContactGroupById,
  getContactGroups,
  updateContactGroup,
  deleteContactGroup,
  addContactToGroup,
  removeContactFromGroup,
  createContactUpload,
  getContactUploadById,
  updateContactUpload,
  getContactUploads,
  createContactGroupField,
  getContactGroupFields,
  getContactGroupFieldById,
  updateContactGroupField,
  deleteContactGroupField,
  updateContactFieldValues,
  getContactGroupByName,
  updateChannelIdentifiers,
  updatePreferences,
  validateFieldValues,
};
