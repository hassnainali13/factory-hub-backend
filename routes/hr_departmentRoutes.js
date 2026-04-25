const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const {
  getAllUsersInWorkspace,
} = require("../controllers/hr_departmentController");

// Route to get all users in the same workspace as the HR department user
router.get(
  "/users",
  authenticate,
  allowRoles("department_head"),
  getAllUsersInWorkspace,
);

module.exports = router;
