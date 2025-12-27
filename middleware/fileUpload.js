const multer = require("multer");
const path = require("path");

const MAX_SIZE_IMAGE = 5 * 1024 * 1024;
const MAX_SIZE_DOC = 10 * 1024 * 1024; 

const ALLOWED_TYPES = {
  image: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
  ],
  pdf: ["application/pdf"],
  doc: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/pdf",
  ],
};
/**
 * Reusable Uploader Middleware Factory
 * @param {string} type - 'image' | 'pdf' | 'doc'
 * @param {number} maxSize - Max file size in bytes (optional)
 */
const createUploader = (type, maxSize) => {
  const storage = multer.memoryStorage();

  const fileFilter = (req, file, cb) => {
    const allowedMimes = ALLOWED_TYPES[type] || [];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(
        `Invalid file type. Allowed: ${allowedMimes.join(", ")}`
      );
      error.code = "INVALID_FILE_TYPE";
      cb(error, false);
    }
  };

  const limits = {
    fileSize: maxSize || (type === "image" ? MAX_SIZE_IMAGE : MAX_SIZE_DOC),
  };

  return multer({ storage, fileFilter, limits });
};

module.exports = { createUploader };
