const express = require("express");
const router = express.Router();

const {
  checkIn,
  checkOut,
  getAttendances,
  submitReport,
  getPendingReports,
  approveReport,
  rejectReport,
  registerFace,
} = require("../controllers/attendanceController");

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

router.post("/check-in", authMiddleware, checkIn);
router.post("/check-out/:id", authMiddleware, checkOut);
router.get("/", authMiddleware, getAttendances);
router.post("/report/:id", authMiddleware, submitReport);
router.get(
  "/reports",
  authMiddleware,
  allowRoles("department_head", "staff"),
  getPendingReports,
);
router.patch(
  "/report/:id/approve",
  authMiddleware,
  allowRoles("department_head", "staff"),
  approveReport,
);
router.patch(
  "/report/:id/reject",
  authMiddleware,
  allowRoles("department_head", "staff"),
  rejectReport,
);
// router.get("/debug-ip-location", authMiddleware, debugIPLocation);
router.post("/register-face", authMiddleware, registerFace);
module.exports = router;
