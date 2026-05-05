// //backend\routes\authRoutes.js
// const express = require("express");
// const { register, login } = require("../controllers/authController");

// const router = express.Router();

// // Register route
// router.post("/register", register);

// // Login route
// router.post("/login", login);

// module.exports = router;

const express = require("express");
const {
  register,
  login,
  verifyOTP,
  verifyResetPasswordOTP,
  resendOTP,
  resendResetOTP,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/verify-reset-otp", verifyResetPasswordOTP);
router.post("/resend-otp", resendOTP);
router.post("/resend-reset-otp", resendResetOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
