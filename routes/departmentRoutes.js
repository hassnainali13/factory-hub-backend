// backend/routes/departmentRoutes.js

const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const Staff = require("../models/Staff");
const Department = require("../models/Department");

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
  updateDepartmentLimit,
  getDepartmentWithStaff,
} = require("../controllers/departmentController");

const allowDepartmentStaffApproval = async (req, res, next) => {
  try {
    if (req.role === "hr_department") {
      return next();
    }

    const staff = await Staff.findById(req.params.staffId).populate(
      "departmentId",
    );
    if (!staff) {
      return res.status(404).json({ message: "Staff request not found" });
    }

    const department = staff.departmentId;
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    if (String(department.deptHeadId) === String(req.userId)) {
      return next();
    }

    return res.status(403).json({ message: "Access denied." });
  } catch (error) {
    console.error("Department staff approval auth error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

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

// ✅ PATCH update department staff limit (ONLY GM)
router.patch(
  "/limit/:id",
  authenticate,
  allowRoles("general_manager", "industry_head"),
  updateDepartmentLimit,
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
router.get("/staff-overview", authenticate, getDepartmentStaffOverview);
router.get("/all-staff-overview", authenticate, getStaffOverview);
router.patch(
  "/staff/:staffId/approve",
  authenticate,
  allowDepartmentStaffApproval,
  approveStaffRequest,
);

router.patch(
  "/staff/:staffId/reject",
  authenticate,
  allowDepartmentStaffApproval,
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
