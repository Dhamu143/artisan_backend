const express = require("express");
const router = express.Router();
const { createUploader } = require("../middleware/fileUpload");
const { uploadToImageKit } = require("../services/storageService");

const uploadAvatar = createUploader("image", 20 * 1024 * 1024);
const uploadDocument = createUploader("doc", 30 * 1024 * 1024);

// ---------------- UPLOAD AVATAR ----------------
router.post(
  "/avatar",
  uploadAvatar.single("file"),
  async (req, res) => {
    console.log("[AVATAR] Upload request received");

    try {
      if (!req.file) {
        console.warn("[AVATAR] No file provided");
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log("[AVATAR] File details:", {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });

      const result = await uploadToImageKit(req.file, "users/avatars");

      console.log("[AVATAR] ImageKit upload success:", {
        url: result.url,
        fileId: result.fileId,
      });

      res.status(200).json({
        issuccess: true,
        message: "Avatar uploaded successfully",
        data: {
          url: result.url,
          thumbnail: result.thumbnailUrl,
          fileId: result.fileId,
        },
      });
    } catch (error) {
      console.error("[AVATAR] Upload failed:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ---------------- UPLOAD DOCUMENT ----------------
router.post(
  "/",
  uploadDocument.single("upload"),
  async (req, res) => {
    console.log("[DOCUMENT] Upload request received");

    try {
      if (!req.file) {
        console.warn("[DOCUMENT] No file provided");
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log("[DOCUMENT] File details:", {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });

      const result = await uploadToImageKit(
        req.file,
        "users/documents",
        true
      );

      console.log("[DOCUMENT] ImageKit upload success:", {
        url: result.url,
        fileId: result.fileId,
      });

      res.status(200).json({
        issuccess: true,
        message: "Document uploaded",
        data: {
          url: result.url,
          name: result.name,
          fileId: result.fileId,
        },
      });
    } catch (error) {
      console.error("[DOCUMENT] Upload failed:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ---------------- ERROR HANDLER ----------------
router.use((err, req, res, next) => {
  console.error("[UPLOAD ERROR]", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File is too large." });
  }

  if (err.code === "INVALID_FILE_TYPE") {
    return res.status(400).json({ error: err.message });
  }

  next(err);
});

module.exports = router;
