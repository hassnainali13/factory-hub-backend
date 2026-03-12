// backend/controllers/joinController.js
const mongoose = require("mongoose");

// const User = require("../models/User");
const Workspace = require("../models/Workspace");
// const Department = require("../models/Department");
const Staff = require("../models/Staff");
// backend/controllers/joinController.js
const User = require("../models/User");
const Department = require("../models/Department");

// 1️⃣ Workspace preview
exports.joinWorkspacePreview = async (req, res) => {
  try {
    const { workspaceCode } = req.body;

    const workspace = await Workspace.findOne({ code: workspaceCode }).populate(
      "createdBy",
      "name email",
    );

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not exists" });
    }

    // ✅ Departments
    // ✅ Departments
    const departments = await Department.find({
      workspaceId: workspace._id,
      status: { $in: ["active", "pending", "disabled"] },
    })
      .select("department status deptHeadId")
      .populate("deptHeadId", "name");

    // ✅ YAHAN headName create kar rahe hain
    const formattedDepartments = departments.map((d) => ({
      _id: d._id,
      department: d.department,
      status: d.status,
      headName: d.deptHeadId?.name || null,
    }));

    res.json({
      workspaceId: workspace._id,
      name: workspace.name,
      logo: workspace.logo,
      generalManager: workspace.createdBy?.name || "—",
      departments: formattedDepartments,
    });
  } catch (err) {
    console.error("joinWorkspacePreview error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 2️⃣ Send request to join a department
exports.sendDepartmentRequest = async (req, res) => {
  try {
    const { departmentId } = req.body;

    if (!departmentId) {
      return res.status(400).json({ message: "Department Id required" });
    }

    const user = await User.findById(req.userId);
    const department = await Department.findById(departmentId);

    if (!user || !department) {
      return res.status(404).json({ message: "User or Department not found" });
    }

    // ✅ If department already active and head assigned
    if (department.status === "active" && department.deptHeadId) {
      return res
        .status(400)
        .json({ message: "Department head already assigned" });
    }

    // ✅ If user already has pending request anywhere
    if (user.requestStatus === "pending") {
      return res
        .status(400)
        .json({ message: "Aapki request already pending hai" });
    }

    // ✅ Ensure headsRequestedBy exists
    if (!department.headsRequestedBy) department.headsRequestedBy = [];

    const userIdStr = user._id.toString();

    // ✅ Check if same user already requested this department
    const alreadyRequested = department.headsRequestedBy
      .map((id) => id.toString())
      .includes(userIdStr);

    if (alreadyRequested) {
      return res
        .status(400)
        .json({ message: "Aapki request already pending hai" });
    }

    // ✅ Push user in requested list
    department.headsRequestedBy.push(user._id);

    // ✅ Make department pending
    department.status = "pending";

    await department.save();

    // ✅ Update user status
    user.departmentId = department._id;
    user.requestStatus = "pending";
    user.role = "user";
    await user.save();

    res.json({ message: "Tumhari request General Manager ko chali gai hai" });
  } catch (err) {
    console.error("sendDepartmentRequest error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 2️⃣a Send request from DepartmentHeadRequestPage.jsx
exports.sendDepartmentHeadRequest = async (req, res) => {
  try {
    const { workspaceId, departmentId } = req.body;

    if (!workspaceId || !departmentId) {
      return res
        .status(400)
        .json({ message: "workspaceId & departmentId required" });
    }

    const user = await User.findById(req.userId);
    const department = await Department.findById(departmentId);

    if (!user || !department) {
      return res.status(404).json({ message: "User or Department not found" });
    }

    // ✅ If department already active and head assigned
    if (department.status === "active" && department.deptHeadId) {
      return res
        .status(400)
        .json({ message: "Department head already assigned" });
    }

    // ✅ If user already pending anywhere
    if (user.requestStatus === "pending") {
      return res
        .status(400)
        .json({ message: "Aapki request already pending hai" });
    }

    // ✅ Ensure headsRequestedBy exists
    if (!department.headsRequestedBy) department.headsRequestedBy = [];

    const userIdStr = user._id.toString();

    // ✅ Check if same user already requested this department
    const alreadyRequested = department.headsRequestedBy
      .map((id) => id.toString())
      .includes(userIdStr);

    if (alreadyRequested) {
      return res
        .status(400)
        .json({ message: "Aapki request already pending hai" });
    }

    // ✅ Push user in requested list
    department.headsRequestedBy.push(user._id);

    // ✅ Make department pending
    department.status = "pending";
    await department.save();

    // ✅ Update user
    user.departmentId = department._id;
    user.requestStatus = "pending";
    user.role = "user";
    await user.save();

    res.json({ message: "Department head request sent successfully" });
  } catch (err) {
    console.error("sendDepartmentHeadRequest error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 3️⃣ Dashboard status
// exports.dashboardStatus = async (req, res) => {
//   try {
//     const user = await User.findById(req.userId).populate(
//       "departmentId",
//       "department status workspaceId deptHeadId",
//     );

//     if (!user) return res.status(404).json({ message: "User not found" });

//     if (!user.departmentId) return res.json({ type: "noDepartment" });

//     if (user.requestStatus === "pending")
//       return res.json({ type: "pending", department: user.departmentId });

//     if (user.requestStatus === "approved")
//       return res.json({ type: "assigned", department: user.departmentId });

//     if (user.requestStatus === "rejected")
//       return res.json({ type: "independent" });

//     return res.json({ type: "independent" });
//   } catch (err) {
//     console.error("dashboardStatus error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

exports.dashboardStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: "departmentId",
      select: "department status workspaceId deptHeadId",
      populate: {
        path: "workspaceId",
        select: "name logo",
      },
    });

    if (!user) {
      return res.status(404).json({
        type: "error",
        message: "User not found",
      });
    }

    /*
    =====================================
    STAFF FLOW SUPPORT ⭐
    =====================================
    */

    if (user.staffId) {
      const staff = await Staff.findById(user.staffId).populate({
        path: "departmentId",
        populate: {
          path: "workspaceId",
          select: "name logo",
        },
      });

      if (staff) {
        return res.json({
          type: staff.status === "pending" ? "pending" : "assigned",

          department: staff.departmentId || null,
          workspace: staff.departmentId?.workspaceId || null,
        });
      }
    }

    /*
    =====================================
    DEPARTMENT FLOW (OLD SYSTEM)
    =====================================
    */

    if (!user.departmentId) {
      return res.json({ type: "noDepartment" });
    }

    const departmentData = user.departmentId;

    if (user.requestStatus === "pending") {
      return res.json({
        type: "pending",
        department: departmentData,
        workspace: departmentData.workspaceId || null,
      });
    }

    if (user.requestStatus === "approved") {
      return res.json({
        type: "assigned",
        department: departmentData,
        workspace: departmentData.workspaceId || null,
      });
    }

    return res.json({
      type: "independent",
    });
  } catch (err) {
    console.error("dashboardStatus error:", err);

    res.status(500).json({
      type: "error",
      message: "Server error",
    });
  }
};

// ✅ Approve a user's department head request
exports.approveRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId } = req.params;

    const user = await User.findById(userId).session(session);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.departmentId)
      return res.status(400).json({ message: "No department request found" });

    const deptId = user.departmentId; // 🔥 store before anything changes

    const department = await Department.findById(deptId).session(session);
    if (!department)
      return res.status(404).json({ message: "Department not found" });

    if (department.deptHeadId)
      return res.status(400).json({ message: "Head already assigned" });

    // ✅ Approve selected user
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          requestStatus: "approved",
          role: "department_head",
        },
      },
      { session },
    );

    // ✅ Reset ALL other pending users (IMPORTANT: no object recreation)
    const result = await User.updateMany(
      {
        departmentId: deptId,
        _id: { $ne: userId },
        requestStatus: "pending",
      },
      {
        $set: {
          departmentId: null,
          requestStatus: null,
          role: "user",
        },
      },
      { session },
    );

    console.log("Reset count:", result.modifiedCount);

    // ✅ Update department
    await Department.updateOne(
      { _id: deptId },
      {
        $set: {
          deptHeadId: userId,
          status: "active",
          headsRequestedBy: [],
        },
      },
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    res.json({ message: "Approved successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
// ✅ Reject a user's department head request
exports.rejectRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.departmentId)
      return res.status(400).json({
        message: "User has no department request",
      });

    // Reset only this user
    user.requestStatus = null;
    user.departmentId = null;
    user.role = "user";

    await user.save();

    res.json({ message: "Request rejected successfully" });
  } catch (error) {
    console.error("rejectRequest error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 6️⃣ Get all pending requests for GM
exports.getPendingRequests = async (req, res) => {
  try {
    const gm = await User.findById(req.userId);

    if (!gm) return res.status(404).json({ message: "User not found" });

    const workspaceId = gm.workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ message: "GM workspace not found" });
    }

    // ✅ Get all departments of this workspace
    const departments = await Department.find({ workspaceId }).select(
      "_id department",
    );

    const departmentIds = departments.map((d) => d._id);

    // ✅ Get all users who are pending for these departments
    const pendingUsers = await User.find({
      departmentId: { $in: departmentIds },
      requestStatus: "pending",
    }).populate("departmentId", "department status");

    // ✅ Format for table
    const formatted = pendingUsers.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      departmentId: u.departmentId?._id,
      departmentName: u.departmentId?.department || "—",
      requestStatus: u.requestStatus,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("getPendingRequests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// ✅ Staff Join Request (NEW)
// ===============================
exports.sendStaffJoinRequest = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ⭐ Already request check
    if (user.staffId) {
      return res.status(400).json({
        message: "Request already exists",
      });
    }

    const staff = await Staff.create({
      userId,
      departmentId: req.body.departmentId,
      status: "pending",
    });

    // ⭐ Correct update
    user.staffId = staff._id;
    user.role = "staff";
    user.staffstatus = "pending";

    await user.save();

    res.json({
      message: "Staff request sent successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message,
    });
  }
};
exports.getStaffStatus = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.userId }).populate({
      path: "departmentId",
      populate: {
        path: "workspaceId",
        select: "name logo",
      },
    });

    if (!staff) {
      return res.json({ type: "none" });
    }

    if (staff.status === "pending") {
      return res.json({
        type: "pending",
        department: staff.departmentId,
        workspace: staff.departmentId?.workspaceId || null,
      });
    }

    if (staff.status === "approved") {
      return res.json({ type: "approved" });
    }

    return res.json({ type: "none" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ type: "error" });
  }
};
