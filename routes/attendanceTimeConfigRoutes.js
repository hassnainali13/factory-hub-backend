const express = require("express");
const router = express.Router();

const {
  getAttendanceTimeConfig,
  updateAttendanceTimeConfig,
} = require("../controllers/attendanceTimeConfigController");

const authMiddleware = require("../middleware/authMiddleware"); // 🔥 ADD

router.get("/", authMiddleware, getAttendanceTimeConfig);
router.put("/", authMiddleware, updateAttendanceTimeConfig);

module.exports = router;
