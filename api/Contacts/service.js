const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const boom = require("@hapi/boom");
const repository = require("./repository");
const logger = require("../../system/utils/logger");
const AzureQueueStorageService = require("../../system/services/Azure/queue");
const {
  normalizePhoneNumber,
  createPhoneQueryVariations,
} = require("../../system/utils/phoneNormalization");
// Queue name for contact uploads
const CONTACT_UPLOAD_QUEUE = process.env.AZURE_CONTACT_QUEUE_NAME;

// Initialize Azure Queue
const queueService = async () => {
  return new AzureQueueStorageService({
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  });
};

/**
 * Create a new contact
 * @param {string} businessId - Business ID
 * @param {Object} contactData - Contact data
 * @returns {Promise<Object>} Created contact
 */
const createContact = async (businessId, contactData) => {
  try {
    // Normalize phone number if provided
    let normalizedPhoneData = {};
    if (contactData.phone) {
      const phoneVariations = createPhoneQueryVariations(contactData.phone);
      logger.info(`Creating contact with phone variations:`, {
        originalPhone: contactData.phone,
        businessId,
        variations: phoneVariations,
      });

      // Check if contact with the same phone already exists using variations
      const existingContact = await repository.findContactByEmailOrPhone(
        businessId,
        contactData.email,
        phoneVariations,
      );

      if (existingContact) {
        throw boom.conflict(
          "Contact with the same email or phone number already exists",
        );
      }

      // Normalize phone for storage
      const normalized = normalizePhoneNumber(contactData.phone);
      if (normalized.isValid) {
        normalizedPhoneData = {
          phone: normalized.e164,
          country_code: normalized.countryCode,
        };
      } else {
        normalizedPhoneData = {
          phone: contactData.phone,
          country_code: null,
        };
      }
    } else if (contactData.email) {
      // Check email only if no phone provided
      const existingContact = await repository.findContactByEmailOrPhone(
        businessId,
        contactData.email,
        null,
      );

      if (existingContact) {
        throw boom.conflict("Contact with the same email already exists");
      }
    }

    //remove the contact_group_id from contactData as it's not a column in end_user table
    const { contact_group_id, created_by, phone, ...data } = contactData;

    // Prepare contact data with normalized phone
    const newContactData = {
      ...data,
      ...normalizedPhoneData,
      business_id: businessId,
      source_type: "manual",
      channel_identifiers: {},
      metadata: {
        ...data.metadata,
        original_phone: contactData.phone, // Keep track of original format
      },
    };

    console.log("newContactData", newContactData);
    // Create contact in database
    const contact = await repository.createContact(newContactData);

    // If contact group is specified, add contact to group
    if (contactData.contact_group_id) {
      await repository.addContactToGroup(
        contact.id,
        contactData.contact_group_id,
        contactData.created_by,
      );
    }

    return contact;
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    logger.error("Error creating contact:", error);
    throw boom.badImplementation("Failed to create contact");
  }
};

/**
 * Get a contact by ID
 * @param {string} contactId - Contact ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Contact object
 */
const getContactById = async (contactId, businessId) => {
  try {
    const contact = await repository.getContactById(contactId, businessId);
    if (!contact) {
      throw boom.notFound("Contact not found");
    }
    return contact;
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    logger.error(`Error getting contact by ID ${contactId}:`, error);
    throw boom.badImplementation("Failed to retrieve contact");
  }
};

/**
 * Get contacts with pagination and filters
 * @param {string} businessId - Business ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Paginated contacts
 */
const getContacts = async (businessId, filters = {}) => {
  try {
    return await repository.getContacts(businessId, filters);
  } catch (error) {
    logger.error(`Error getting contacts for business ${businessId}:`, error);
    throw boom.badImplementation("Failed to retrieve contacts");
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
    // Check if contact exists
    const existingContact = await repository.getContactById(
      contactId,
      businessId,
    );
    if (!existingContact) {
      throw boom.notFound("Contact not found");
    } // If email or phone is updated, check for duplicates
    if (contactData.email || contactData.phone) {
      let phoneVariationsForCheck = null;
      if (contactData.phone) {
        phoneVariationsForCheck = createPhoneQueryVariations(contactData.phone);
      }

      const duplicateContact = await repository.findContactByEmailOrPhone(
        businessId,
        contactData.email || existingContact.email,
        phoneVariationsForCheck ||
          (existingContact.phone
            ? createPhoneQueryVariations(existingContact.phone)
            : null),
      );

      if (duplicateContact && duplicateContact.id !== contactId) {
        throw boom.conflict(
          "Another contact with the same email or phone number already exists",
        );
      }
    }

    // Handle contact group changes
    const oldGroupId =
      existingContact.contactGroups && existingContact.contactGroups.length > 0
        ? existingContact.contactGroups[0].id
        : null;

    const newGroupId = contactData.contact_group_id; // Remove contact_group_id from update data as it's not a column in end_user table
    const { contact_group_id, phone, ...updateData } = contactData;

    // Normalize phone number if being updated
    if (contactData.phone) {
      const normalized = normalizePhoneNumber(contactData.phone);
      if (normalized.isValid) {
        updateData.phone = normalized.e164;
        updateData.country_code = normalized.countryCode;
      } else {
        updateData.phone = contactData.phone;
        updateData.country_code = null;
      }

      // Update metadata to track original phone
      updateData.metadata = {
        ...existingContact.metadata,
        original_phone: contactData.phone,
      };
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update contact in database
    const updatedContact = await repository.updateContact(
      contactId,
      businessId,
      updateData,
    );

    // Handle group association changes
    if (newGroupId !== undefined && newGroupId !== oldGroupId) {
      // Remove from old group if exists
      if (oldGroupId) {
        await repository.removeContactFromGroup(contactId, oldGroupId);
      }

      // Add to new group if provided
      if (newGroupId) {
        await repository.addContactToGroup(contactId, newGroupId);
      }
    }

    return updatedContact;
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    logger.error(`Error updating contact ${contactId}:`, error);
    throw boom.badImplementation("Failed to update contact");
  }
};

/**
 * Delete a contact
 * @param {string} contactId - Contact ID
 * @param {string} businessId - Business ID
 * @returns {Promise<boolean>} Deletion result
 */
const deleteContact = async (contactId, businessId) => {
  try {
    // Check if contact exists
    const contact = await repository.getContactById(contactId, businessId);
    if (!contact) {
      throw boom.notFound("Contact not found");
    }

    // Delete contact
    await repository.deleteContact(contactId, businessId);
    return true;
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    logger.error(`Error deleting contact ${contactId}:`, error);
    throw boom.badImplementation("Failed to delete contact");
  }
};

/**
 * Create a new contact group
 * @param {string} businessId - Business ID
 * @param {string} userId - User ID who created the group
 * @param {Object} groupData - Contact group data
 * @returns {Promise<Object>} Created contact group
 */
const createContactGroup = async (businessId, userId, groupData) => {
  try {
    const newGroupData = {
      ...groupData,
      business_id: businessId,
      created_by: userId,
    };

    const group = await repository.createContactGroup(newGroupData);
    return {
      ...group,
      contact_count: 0,
    };
  } catch (error) {
    if (error.code === "23505") {
      // PostgreSQL unique constraint violation
      throw boom.conflict("A contact group with this name already exists");
    }
    logger.error("Error creating contact group:", error);
    throw boom.badImplementation("Failed to create contact group");
  }
};

/**
 * Get a contact group by ID
 * @param {string} groupId - Contact group ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Contact group object
 */
const getContactGroupById = async (groupId, businessId) => {
  try {
    const group = await repository.getContactGroupById(groupId, businessId);
    if (!group) {
      throw boom.notFound("Contact group not found");
    }
    return {
      ...group,
      contact_count: group.contacts ? group.contacts.length : 0,
    };
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    logger.error(`Error getting contact group by ID ${groupId}:`, error);
    throw boom.badImplementation("Failed to retrieve contact group");
  }
};

/**
 * Get contact groups with pagination and filters
 * @param {string} businessId - Business ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Paginated contact groups
 */
const getContactGroups = async (businessId, filters = {}) => {
  try {
    return await repository.getContactGroups(businessId, filters);
  } catch (error) {
    logger.error(
      `Error getting contact groups for business ${businessId}:`,
      error,
    );
    throw boom.badImplementation("Failed to retrieve contact groups");
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
    // Check if group exists
    const existingGroup = await repository.getContactGroupById(
      groupId,
      businessId,
    );
    if (!existingGroup) {
      throw boom.notFound("Contact group not found");
    }

    // Add updated_at timestamp
    groupData.updated_at = new Date().toISOString();

    // Update group
    const updatedGroup = await repository.updateContactGroup(
      groupId,
      businessId,
      groupData,
    );
    return updatedGroup;
  } catch (error) {
    if (error.code === "23505") {
      // PostgreSQL unique constraint violation
      throw boom.conflict("A contact group with this name already exists");
    }
    if (error.isBoom) {
      throw error;
    }
    logger.error(`Error updating contact group ${groupId}:`, error);
    throw boom.badImplementation("Failed to update contact group");
  }
};

/**
 * Delete a contact group
 * @param {string} groupId - Contact group ID
 * @param {string} businessId - Business ID
 * @returns {Promise<boolean>} Deletion result
 */
const deleteContactGroup = async (groupId, businessId) => {
  try {
    // Check if group exists
    const group = await repository.getContactGroupById(groupId, businessId);
    if (!group) {
      throw boom.notFound("Contact group not found");
    }

    // Delete group
    await repository.deleteContactGroup(groupId, businessId);
    return true;
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    logger.error(`Error deleting contact group ${groupId}:`, error);
    throw boom.badImplementation("Failed to delete contact group");
  }
};

/**
 * Add contact to a group
 * @param {string} contactId - Contact ID
 * @param {string} groupId - Contact group ID
 * @param {string} businessId - Business ID
 * @param {string} userId - User ID who performed the action
 * @returns {Promise<boolean>} Operation result
 */
const addContactToGroup = async (contactId, groupId, businessId, userId) => {
  try {
    // Check if contact exists and belongs to the business
    const contact = await repository.getContactById(contactId, businessId);
    if (!contact) {
      throw boom.notFound("Contact not found");
    }

    // Check if group exists and belongs to the business
    const group = await repository.getContactGroupById(groupId, businessId);
    if (!group) {
      throw boom.notFound("Contact group not found");
    }

    // Add contact to group
    await repository.addContactToGroup(contactId, groupId, userId);
    return true;
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    logger.error(
      `Error adding contact ${contactId} to group ${groupId}:`,
      error,
    );
    throw boom.badImplementation("Failed to add contact to group");
  }
};

/**
 * Remove contact from a group
 * @param {string} contactId - Contact ID
 * @param {string} groupId - Contact group ID
 * @param {string} businessId - Business ID
 * @returns {Promise<boolean>} Operation result
 */
const removeContactFromGroup = async (contactId, groupId, businessId) => {
  try {
    // Check if contact exists and belongs to the business
    const contact = await repository.getContactById(contactId, businessId);
    if (!contact) {
      throw boom.notFound("Contact not found");
    }

    // Check if group exists and belongs to the business
    const group = await repository.getContactGroupById(groupId, businessId);
    if (!group) {
      throw boom.notFound("Contact group not found");
    }

    // Remove contact from group
    await repository.removeContactFromGroup(contactId, groupId);
    return true;
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    logger.error(
      `Error removing contact ${contactId} from group ${groupId}:`,
      error,
    );
    throw boom.badImplementation("Failed to remove contact from group");
  }
};

/**
 * Create upload record and queue the file for processing
 * @param {Object} uploadData - Upload data including file info
 * @param {string} businessId - Business ID
 * @param {string} userId - User ID who uploaded the file
 * @returns {Promise<Object>} Upload record
 */
const uploadContacts = async (uploadData, businessId, userId) => {
  try {
    // Validate file
    const { file } = uploadData;
    if (!file) {
      throw boom.badRequest("No file uploaded");
    }

    // Check file extension
    const extension = path.extname(file.originalname).toLowerCase();
    if (![".xlsx", ".xls", ".csv"].includes(extension)) {
      throw boom.badRequest(
        "Unsupported file format. Please upload Excel or CSV file",
      );
    }

    // Check file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      throw boom.payloadTooLarge("File size exceeds the 10MB limit");
    }

    // Handle contact group
    let contactGroupId = uploadData.contact_group_id;

    // Create new group if requested
    if (uploadData.create_new_group && uploadData.new_group_name) {
      const newGroup = await repository.createContactGroup({
        business_id: businessId,
        name: uploadData.new_group_name,
        created_by: userId,
      });
      contactGroupId = newGroup.id;
    }

    // Create upload record in database
    const uploadRecord = await repository.createContactUpload({
      business_id: businessId,
      uploaded_by: userId,
      contact_group_id: contactGroupId,
      filename: file.filename,
      original_filename: file.originalname,
      file_size: file.size,
      status: "pending",
    });
    console.log("===>>", CONTACT_UPLOAD_QUEUE);
    // Queue the file for processing
    const newQueueService = await queueService();
    await newQueueService.createQueue(CONTACT_UPLOAD_QUEUE);
    await newQueueService.sendMessage({
      queueName: CONTACT_UPLOAD_QUEUE,
      message: {
        uploadId: uploadRecord.id,
        businessId: businessId,
        filePath: file.path,
        contactGroupId: contactGroupId,
      },
      timeToLive: 24 * 60 * 60, // 24 hours TTL
    });

    // Return upload record with status URL
    return {
      ...uploadRecord,
      status_url: `/contacts/bulk-upload/${uploadRecord.id}/status`,
    };
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    logger.error("Error uploading contacts:", error);
    throw boom.badImplementation("Failed to upload contacts");
  }
};

/**
 * Get upload status
 * @param {string} uploadId - Upload ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Upload status
 */
const getUploadStatus = async (uploadId, businessId) => {
  try {
    const upload = await repository.getContactUploadById(uploadId, businessId);
    if (!upload) {
      throw boom.notFound("Upload record not found");
    }

    // Calculate completion percentage
    let completionPercentage = 0;
    if (upload.total_records && upload.total_records > 0) {
      completionPercentage = Math.round(
        (upload.processed_records / upload.total_records) * 100,
      );
    }

    return {
      upload_id: upload.id,
      status: upload.status,
      total_records: upload.total_records || 0,
      processed_records: upload.processed_records || 0,
      accepted_records: upload.accepted_records || 0,
      rejected_records: upload.rejected_records || 0,
      completion_percentage: completionPercentage,
      errors: upload.errors || [],
      contact_group_id: upload.contact_group_id,
      created_at: upload.created_at,
      completed_at: upload.completed_at,
    };
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    logger.error(`Error getting upload status for ID ${uploadId}:`, error);
    throw boom.badImplementation("Failed to get upload status");
  }
};

/**
 * Process a contact upload file (to be called by worker)
 * @param {string} uploadId - Upload ID
 * @param {string} filePath - Path to the uploaded file
 * @param {string} contactGroupId - Contact group ID (optional)
 * @returns {Promise<Object>} Processing result
 */
const processContactUpload = async (uploadId, filePath, contactGroupId) => {
  try {
    // Get upload record
    const upload = await repository.getContactUploadById(uploadId);
    if (!upload) {
      throw new Error("Upload record not found");
    }

    // Update status to processing
    await repository.updateContactUpload(uploadId, {
      status: "processing",
      updated_at: new Date().toISOString(),
    });

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    // Read file content
    const workbook = XLSX.readFile(filePath, {
      type: "file",
      cellDates: true,
    });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Update total records
    await repository.updateContactUpload(uploadId, {
      total_records: data.length,
      updated_at: new Date().toISOString(),
    });

    // Process records
    const errors = [];
    let processedCount = 0;
    let acceptedCount = 0;
    let rejectedCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        processedCount++;

        // Update processed count every 10 records
        if (processedCount % 10 === 0) {
          await repository.updateContactUpload(uploadId, {
            processed_records: processedCount,
            updated_at: new Date().toISOString(),
          });
        } // Validate required fields
        if (!row.phone && !row.email) {
          throw new Error("Either phone or email is required");
        }

        // Normalize phone number if present
        let normalizedPhoneData = {};
        if (row.phone) {
          const normalized = normalizePhoneNumber(row.phone);
          if (normalized.isValid) {
            normalizedPhoneData = {
              phone: normalized.e164,
              country_code: normalized.countryCode,
            };
          } else {
            // Fallback to basic E.164 formatting
            let formattedPhone = row.phone.trim();
            if (!formattedPhone.startsWith("+")) {
              formattedPhone = "+" + formattedPhone;
            }

            // Basic validation
            if (!/^\+[1-9]\d{1,14}$/.test(formattedPhone)) {
              throw new Error(
                "Invalid phone number format (must be E.164 format)",
              );
            }

            normalizedPhoneData = {
              phone: formattedPhone,
              country_code: null,
            };
          }
        }

        // Check if contact already exists using phone variations
        let phoneVariationsForCheck = null;
        if (normalizedPhoneData.phone) {
          phoneVariationsForCheck = createPhoneQueryVariations(
            normalizedPhoneData.phone,
          );
        }

        const existingContact = await repository.findContactByEmailOrPhone(
          upload.business_id,
          row.email,
          phoneVariationsForCheck,
        );
        if (existingContact) {
          // If contact exists, update it with new information
          const updateData = {
            first_name: row.first_name || existingContact.first_name,
            last_name: row.last_name || existingContact.last_name,
            ...normalizedPhoneData,
            email: row.email || existingContact.email,
            updated_at: new Date().toISOString(),
          };

          // Add custom fields to metadata if present
          const metadata = { ...existingContact.metadata } || {};
          Object.keys(row).forEach((key) => {
            if (!["first_name", "last_name", "phone", "email"].includes(key)) {
              metadata[key] = row[key];
            }
          });

          // Track original phone format if phone was provided
          if (row.phone) {
            metadata.original_phone = row.phone;
          }

          updateData.metadata = metadata;

          await repository.updateContact(
            existingContact.id,
            upload.business_id,
            updateData,
          );

          // Add to group if specified and not already in the group
          if (contactGroupId) {
            await repository.addContactToGroup(
              existingContact.id,
              contactGroupId,
              upload.uploaded_by,
            );
          }
        } else {
          // Create new contact
          const contactData = {
            business_id: upload.business_id,
            first_name: row.first_name || "",
            last_name: row.last_name || "",
            ...normalizedPhoneData,
            email: row.email,
            source_type: "bulk_upload",
            source_id: upload.id,
            channel_identifiers: {},
          };

          // Add custom fields to metadata
          const metadata = {};
          Object.keys(row).forEach((key) => {
            if (!["first_name", "last_name", "phone", "email"].includes(key)) {
              metadata[key] = row[key];
            }
          });

          // Track original phone format if phone was provided
          if (row.phone) {
            metadata.original_phone = row.phone;
          }

          contactData.metadata = metadata;

          // Create contact
          const newContact = await repository.createContact(contactData);

          // Add to group if specified
          if (contactGroupId) {
            await repository.addContactToGroup(
              newContact.id,
              contactGroupId,
              upload.uploaded_by,
            );
          }
        }

        acceptedCount++;
      } catch (error) {
        rejectedCount++;
        errors.push({
          row: i + 2, // Add 2 to account for header row and 0-indexing
          message: error.message,
          data: row,
        });
      }
    }

    // Update final status
    await repository.updateContactUpload(uploadId, {
      status: "completed",
      processed_records: processedCount,
      accepted_records: acceptedCount,
      rejected_records: rejectedCount,
      errors: errors.length > 0 ? errors : null,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Clean up the file
    try {
      fs.unlinkSync(filePath);
    } catch (fileError) {
      logger.error(`Error removing temporary file: ${fileError.message}`);
    }

    return {
      uploadId,
      status: "completed",
      totalRecords: processedCount,
      acceptedRecords: acceptedCount,
      rejectedRecords: rejectedCount,
      errors: errors.length,
    };
  } catch (error) {
    logger.error(`Error processing contact upload ${uploadId}:`, error);

    // Update status to failed
    await repository.updateContactUpload(uploadId, {
      status: "failed",
      errors: [{ message: error.message }],
      updated_at: new Date().toISOString(),
    });

    throw error;
  }
};

/**
 * Generate error report CSV for a failed upload
 * @param {string} uploadId - Upload ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} CSV data and filename
 */
const generateErrorReport = async (uploadId, businessId) => {
  try {
    const upload = await repository.getContactUploadById(uploadId, businessId);
    if (!upload) {
      throw boom.notFound("Upload record not found");
    }

    if (!upload.errors || upload.errors.length === 0) {
      throw boom.badRequest("No errors found for this upload");
    }

    // Create CSV content
    let csvContent = "Row,Error Message,Data\n";

    upload.errors.forEach((error) => {
      const dataStr = JSON.stringify(error.data || {}).replace(/"/g, '""');
      csvContent += `${error.row},"${error.message}","${dataStr}"\n`;
    });

    return {
      content: csvContent,
      filename: `upload_errors_${uploadId}.csv`,
    };
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    logger.error(
      `Error generating error report for upload ${uploadId}:`,
      error,
    );
    throw boom.badImplementation("Failed to generate error report");
  }
};

/**
 * Get all contact uploads for a business
 * @param {string} businessId - Business ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated uploads
 */
const getContactUploads = async (businessId, page = 1, limit = 20) => {
  try {
    return await repository.getContactUploads(businessId, page, limit);
  } catch (error) {
    logger.error(
      `Error getting contact uploads for business ${businessId}:`,
      error,
    );
    throw boom.badImplementation("Failed to retrieve contact uploads");
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
  uploadContacts,
  getUploadStatus,
  processContactUpload,
  generateErrorReport,
  getContactUploads,
};
