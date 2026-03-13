//backend\routes\joinRoutes.js
const express = require("express");

const {
  joinWorkspacePreview,
  sendDepartmentRequest,
  sendDepartmentHeadRequest,
  dashboardStatus,
  approveRequest,
  rejectRequest,
  getPendingRequests,
  sendStaffJoinRequest,
  approveStaffRequest,
  rejectStaffRequest,
  getStaffStatus,
} = require("../controllers/joinController");

const authenticate = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

/*
========================================
Workspace Preview
========================================
*/
router.post("/preview", authenticate, joinWorkspacePreview);

/*
========================================
Join Workspace Department Request
========================================
*/
router.post("/request", authenticate, sendDepartmentRequest);

/*
========================================
Department Head Request Page
========================================
*/

router.post(
  "/send-department-request",
  authenticate,
  sendDepartmentHeadRequest,
);

/*
========================================
Dashboard Status
========================================
*/
router.get("/dashboard-status", authenticate, dashboardStatus);

/*
========================================
GM Approve / Reject
========================================
*/
router.patch(
  "/requests/:userId/approve",
  authenticate,
  allowRoles("general_manager"),
  approveRequest,
);
// router.patch(
//   "/reject/:userId",
//   authenticate,
//   allowRoles("general_manager"),
//   rejectRequest,
// );

// GM Reject Request
router.patch(
  "/requests/:userId/reject",
  authenticate,
  allowRoles("general_manager"),
  rejectRequest,
);

/*
========================================
Pending Requests GM Panel
========================================
*/
router.get(
  "/pending-requests",
  authenticate,
  allowRoles("general_manager"),
  getPendingRequests,
);

/*
========================================
Staff Workflow (✔ Fixed Crash Risk)
========================================
*/
router.post(
  "/send-staff-request",
  authenticate,
  allowRoles("user"),
  sendStaffJoinRequest,
);
router.get("/staff-status", authenticate, getStaffStatus);

module.exports = router;
