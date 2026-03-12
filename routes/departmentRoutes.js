// backend/routes/departmentRoutes.js

const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const {
  getDepartments,
  createDepartment,
  approveDepartment,
  rejectDepartment,
  approveHeadRequest,
  getMyDepartment,
  getDepartmentStaffOverview,
  getStaffOverview,
  approveStaffRequest,
  rejectStaffRequest,
  getDepartmentWithStaff,
} = require("../controllers/departmentController");

// ✅ GET departments (workspaceId required)
router.get("/", authenticate, getDepartments);

// ✅ POST create a new department (ONLY GM)
router.post(
  "/create",
  authenticate,
  allowRoles("general_manager", "industry_head"),
  createDepartment,
);

// ✅ PATCH approve a department (ONLY GM)
router.patch(
  "/approve/:id",
  authenticate,
  allowRoles("general_manager", "industry_head"),
  approveDepartment,
);

// ✅ PATCH reject a department (ONLY GM)
router.patch(
  "/reject/:id",
  authenticate,
  allowRoles("general_manager", "industry_head"),
  rejectDepartment,
);
// backend/routes/departmentRoutes.js
// backend/routes/departmentRoutes.js
router.patch(
  "/approve-head/:userId",
  authenticate,
  allowRoles("general_manager", "industry_head"),
  approveHeadRequest,
);

router.get("/my-department", authenticate, getMyDepartment);
router.get(
  "/staff-overview",
  authenticate,
  allowRoles("department_head"),
  getDepartmentStaffOverview,
);
router.get("/staff-overview", authenticate, getStaffOverview);
router.patch(
  "/staff/:staffId/approve",
  authenticate,
  allowRoles("department_head"),
  approveStaffRequest,
);

router.patch(
  "/staff/:staffId/reject",
  authenticate,
  allowRoles("department_head"),
  rejectStaffRequest,
);

// backend/routes/departmentRoutes.js

router.get(
  "/full-details/:departmentId",
  authenticate,
  allowRoles("general_manager", "industry_head", "department_head"),
  getDepartmentWithStaff,
);

module.exports = router;
