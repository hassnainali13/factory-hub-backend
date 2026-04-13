const User = require("../models/User");
const Department = require("../models/Department");
const Staff = require("../models/Staff");

const resolveWorkspaceId = async (req) => {
  try {
    const userId = req.userId || req.user?.id;

    if (!userId) return null;

    // 1. USER direct workspace
    const user = await User.findById(userId);

    if (user?.workspaceId) return user.workspaceId;

    // 2. DEPARTMENT HEAD → department → workspace
    if (user?.departmentId) {
      const dept = await Department.findById(user.departmentId);
      if (dept?.workspaceId) return dept.workspaceId;
    }

    // 3. STAFF → staff → department → workspace
    if (user?.staffId) {
      const staff = await Staff.findById(user.staffId);

      if (staff?.departmentId) {
        const dept = await Department.findById(staff.departmentId);
        if (dept?.workspaceId) return dept.workspaceId;
      }
    }

    return null;
  } catch (err) {
    console.error("Workspace Resolve Error:", err);
    return null;
  }
};

module.exports = resolveWorkspaceId;