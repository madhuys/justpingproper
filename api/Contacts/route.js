const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const contactsController = require("./controller");
const { validateRequest } = require("../../system/middleware/validate-request");
const { hasPermission } = require("../../system/middleware/auth");
const schema = require("./schema");
const controllerHandler = require("../../system/utils/controller-handler");
const auth = require("../../system/middleware/auth");

// Configure file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(
            process.env.FILE_UPLOAD_FOLDER,
            "storage/contacts",
        );

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with original extension
        const fileExt = path.extname(file.originalname);
        const fileName = `${uuidv4()}${fileExt}`;
        cb(null, fileName);
    },
});

// Filter allowed file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only Excel and CSV files are allowed"), false);
    }
};

// Configure upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

// Contact management routes
router.post(
    "/",
    auth.verifyToken,
    auth.hasRole("Super Admin"),
    validateRequest(schema.contactSchema),
    controllerHandler(contactsController.createContact, (req) => [req]),
);

router.get(
    "/",
    hasPermission("contacts.read"),
    controllerHandler(contactsController.getContacts, (req) => [req]),
);

router.get(
    "/groups",
    hasPermission("contacts.read"),
    controllerHandler(contactsController.getContactGroups, (req) => [req]),
);

router.get(
    "/:contactId",
    hasPermission("contacts.read"),
    controllerHandler(contactsController.getContactById, (req) => [req]),
);

router.put(
    "/:contactId",
    hasPermission("contacts.update"),
    validateRequest(schema.updateContactSchema),
    controllerHandler(contactsController.updateContact, (req) => [req]),
);

router.delete(
    "/:contactId",
    hasPermission("contacts.delete"),
    controllerHandler(contactsController.deleteContact, (req) => [req]),
);

// Contact group management routes
router.post(
    "/groups",
    auth.verifyToken,
    auth.hasRole("Super Admin"),
    validateRequest(schema.contactGroupSchema),
    controllerHandler(contactsController.createContactGroup, (req) => [req]),
);

router.get(
    "/groups/:groupId",
    hasPermission("contacts.read"),
    controllerHandler(contactsController.getContactGroupById, (req) => [req]),
);

router.put(
    "/groups/:groupId",
    hasPermission("contacts.update"),
    validateRequest(schema.updateContactGroupSchema),
    controllerHandler(contactsController.updateContactGroup, (req) => [req]),
);

router.delete(
    "/groups/:groupId",
    hasPermission("contacts.delete"),
    controllerHandler(contactsController.deleteContactGroup, (req) => [req]),
);

// Contact-group association routes - Replace existing route with updated one that supports field values
router.post(
    "/:contactId/groups/:groupId",
    hasPermission("contacts.update"),
    validateRequest(schema.addContactToGroupSchema),
    controllerHandler(contactsController.addContactToGroup, (req) => [req]),
);

router.delete(
    "/:contactId/groups/:groupId",
    hasPermission("contacts.update"),
    controllerHandler(contactsController.removeContactFromGroup, (req) => [
        req,
    ]),
);

// Contact group field management routes
router.post(
    "/contact-groups/:groupId/fields",
    hasPermission("contacts.create"),
    validateRequest(schema.contactGroupFieldSchema),
    controllerHandler(contactsController.createContactGroupField, (req) => [
        req,
    ]),
);

router.get(
    "/contact-groups/:groupId/fields",
    hasPermission("contacts.read"),
    controllerHandler(contactsController.getContactGroupFields, (req) => [req]),
);

router.get(
    "/contact-groups/:groupId/fields/:fieldId",
    hasPermission("contacts.read"),
    controllerHandler(contactsController.getContactGroupFieldById, (req) => [
        req,
    ]),
);

router.put(
    "/contact-groups/:groupId/fields/:fieldId",
    hasPermission("contacts.update"),
    validateRequest(schema.updateContactGroupFieldSchema),
    controllerHandler(contactsController.updateContactGroupField, (req) => [
        req,
    ]),
);

router.delete(
    "/contact-groups/:groupId/fields/:fieldId",
    hasPermission("contacts.delete"),
    controllerHandler(contactsController.deleteContactGroupField, (req) => [
        req,
    ]),
);

// Update field values for a contact in a group
router.put(
    "/contacts/:contactId/groups/:groupId/fields",
    hasPermission("contacts.update"),
    validateRequest(schema.updateContactFieldValuesSchema),
    controllerHandler(contactsController.updateContactFieldValues, (req) => [
        req,
    ]),
);

// Bulk upload routes
router.post(
    "/bulk-upload",
    hasPermission("contacts.create"),
    upload.single("file"),
    validateRequest(schema.bulkUploadSchema),
    controllerHandler(contactsController.bulkUploadContacts, (req) => [req]),
);

router.get(
    "/bulk-upload/:uploadId/status",
    hasPermission("contacts.read"),
    controllerHandler(contactsController.getUploadStatus, (req) => [req]),
);

router.get(
    "/bulk-upload/:uploadId/errors",
    hasPermission("contacts.read"),
    contactsController.downloadErrorReport,
);

router.get(
    "/bulk-upload",
    hasPermission("contacts.read"),
    controllerHandler(contactsController.getContactUploads, (req) => [req]),
);

// Channel identifiers management routes
router.put(
    "/:contactId/channel-identifiers",
    hasPermission("contacts.update"),
    validateRequest(schema.updateChannelIdentifiersSchema),
    controllerHandler(contactsController.updateChannelIdentifiers, (req) => [
        req,
    ]),
);

// Preferences management routes
router.put(
    "/:contactId/preferences",
    hasPermission("contacts.update"),
    validateRequest(schema.updatePreferencesSchema),
    controllerHandler(contactsController.updatePreferences, (req) => [req]),
);

// Field values validation route
router.post(
    "/groups/:groupId/validate-fields",
    hasPermission("contacts.read"),
    validateRequest(schema.validateFieldValuesSchema),
    controllerHandler(contactsController.validateFieldValues, (req) => [req]),
);

module.exports = router;
