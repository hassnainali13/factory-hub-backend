// routes/userRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const authenticate = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

const router = express.Router();

// create folder if not exists
const uploadDir = "uploads/profileImages";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.userId}_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });
// =======================
// Protected routes (require auth)
// =======================

// Get current user profile
router.get("/me", authenticate, userController.getProfile);

// Update profile (name, email, profile image)
router.put(
  "/me",
  authenticate,
  upload.single("profileImage"), // optional profile image upload
  userController.updateProfile,
);

// Change password
router.put("/change-password", authenticate, userController.changePassword);

// Get all pending users (for DepartmentHeadRequestsList)
router.get("/pending", authenticate, userController.getPendingUsers);

// =======================
// Password reset (no auth needed)
// =======================

// Request password reset token
router.post("/request-password-reset", userController.requestPasswordReset);

// Reset password with token
router.post("/reset-password", userController.resetPassword);

module.exports = router;
