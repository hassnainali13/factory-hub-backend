const express = require("express");
const router = express.Router();

const {
  checkIn,
  checkOut,
  getAttendances,
  
  registerFace,
} = require("../controllers/attendanceController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/check-in", authMiddleware, checkIn);
router.post("/check-out/:id", authMiddleware, checkOut);
router.get("/", authMiddleware, getAttendances);
// router.get("/debug-ip-location", authMiddleware, debugIPLocation);
router.post("/register-face", authMiddleware, registerFace);
module.exports = router;
