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
  resendOTP
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", login);

module.exports = router;