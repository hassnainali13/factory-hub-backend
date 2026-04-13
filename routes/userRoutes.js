// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { uploadProfile } = require("../config/cloudinary");
const authenticate = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

// Get profile
router.get("/me", authenticate, userController.getProfile);

// ✅ Upload image
router.put(
  "/me",
  authenticate,
  uploadProfile.single("profile"), // ✅ MUST MATCH frontend
  userController.updateProfile
);

router.put("/change-password", authenticate, userController.changePassword);
router.get("/pending", authenticate, userController.getPendingUsers);

module.exports = router;