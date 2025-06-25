// api/Business/route.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const businessController = require("./controller");
const { validateRequest } = require("../../system/middleware/validate-request");
const { hasPermission, verifyToken } = require("../../system/middleware/auth");
const schema = require("./schema");
const controllerHandler = require("../../system/utils/controller-handler");

// Configure file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine upload directory based on file type
    let uploadDir;
    if (file.fieldname === "profile_image") {
      uploadDir = path.join(process.env.FILE_UPLOAD_FOLDER, "storage/profiles");
    } else if (file.fieldname === "document") {
      uploadDir = path.join(
        process.env.FILE_UPLOAD_FOLDER,
        "storage/documents/business"
      );
    } else {
      uploadDir = path.join(process.env.FILE_UPLOAD_FOLDER, "storage/temp");
    }

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
  // Define allowed types by field name
  const allowedTypes = {
    profile_image: ["image/jpeg", "image/png", "image/gif"],
    document: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  };

  // Check if file type is allowed
  if (
    allowedTypes[file.fieldname] &&
    allowedTypes[file.fieldname].includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed types for ${file.fieldname}: ${allowedTypes[
          file.fieldname
        ].join(", ")}`
      ),
      false
    );
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

// All routes require authentication
router.use(verifyToken);

// Business profile management routes
router.get(
  "/",
  hasPermission("business.read"),
  controllerHandler(businessController.getBusinessProfile, (req) => [req])
);

router.put(
  "/",
  hasPermission("business.update"),
  validateRequest(schema.updateBusinessProfileSchema),
  controllerHandler(businessController.updateBusinessProfile, (req) => [req])
);

router.post(
  "/profile-image",
  hasPermission("business.update"),
  upload.single("profile_image"),
  controllerHandler(businessController.updateBusinessProfileImage, (req) => [
    req,
  ])
);

// KYC management routes
router.get(
  "/kyc",
  hasPermission("business.read"),
  controllerHandler(businessController.getKycInformation, (req) => [req])
);

router.put(
  "/kyc",
  hasPermission("business.update"),
  validateRequest(schema.updateKycSchema),
  controllerHandler(businessController.updateKycInformation, (req) => [req])
);

// Verification status route
router.get(
  "/verification",
  hasPermission("business.read"),
  controllerHandler(businessController.getBusinessVerificationStatus, (req) => [
    req,
  ])
);

// Document management routes
router.post(
  "/documents",
  hasPermission("business.create"),
  upload.single("document"),
  validateRequest(schema.uploadDocumentSchema),
  controllerHandler(businessController.uploadBusinessDocument, (req) => [req])
);

router.get(
  "/documents",
  hasPermission("business.read"),
  controllerHandler(businessController.getBusinessDocuments, (req) => [req])
);

router.get(
  "/documents/:document_id",
  hasPermission("business.read"),
  controllerHandler(businessController.getBusinessDocumentById, (req) => [req])
);

router.get(
  "/documents/:document_id/download",
  hasPermission("business.read"),
  businessController.downloadBusinessDocument
);

router.put(
  "/documents/:document_id",
  hasPermission("business.update"),
  validateRequest(schema.updateDocumentSchema),
  controllerHandler(businessController.updateBusinessDocument, (req) => [req])
);

router.delete(
  "/documents/:document_id",
  hasPermission("business.delete"),
  controllerHandler(businessController.deleteBusinessDocument, (req) => [req])
);

module.exports = router;
