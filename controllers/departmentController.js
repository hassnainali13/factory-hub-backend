// //backend\controllers\departmentController.js
// const User = require("../models/User");
// const Department = require("../models/Department");
// const Staff = require("../models/Staff");
// // ✅ Get departments by workspace
// exports.getDepartments = async (req, res) => {
//   try {
//     const { workspaceId } = req.query;

//     if (!workspaceId) {
//       return res.status(400).json({
//         message: "workspaceId is required",
//       });
//     }

//     // ✅ Populate department head
//     const departments = await Department.find({ workspaceId })
//       .populate("deptHeadId", "name")
//       .lean();

//     // ✅ Create headName field for frontend
//     const formattedDepartments = departments.map((d) => ({
//       ...d,
//       headName: d.deptHeadId?.name || null,
//     }));

//     res.status(200).json(formattedDepartments);
//   } catch (err) {
//     console.error("Get departments error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ✅ Create a new department
// exports.createDepartment = async (req, res) => {
//   const { department, head, employeesLimit, status, workspaceId } = req.body;

//   if (!department || !workspaceId || employeesLimit === undefined) {
//     return res.status(400).json({
//       message: "Department, workspaceId, and employeesLimit are required",
//     });
//   }

//   try {
//     const newDept = await Department.create({
//       department,
//       head,
//       employeesLimit, // ✅ correct field
//       status: status || "disabled",
//       workspaceId,
//       deptHeadId: null,
//     });

//     res.status(201).json(newDept);
//   } catch (err) {
//     console.error("Create department error:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// // ✅ Approve department (ONLY status change, no head assign)
// exports.approveDepartment = async (req, res) => {
//   try {
//     const dept = await Department.findById(req.params.id);

//     if (!dept) return res.status(404).json({ message: "Department not found" });

//     // ❌ If head not assigned, keep it pending (GM will approve user later)
//     if (!dept.deptHeadId) {
//       dept.status = "pending";
//     } else {
//       dept.status = "active";
//     }

//     await dept.save();

//     res.json(dept);
//   } catch (err) {
//     console.error("approveDepartment error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ✅ Reject department (disable + remove head)
// exports.rejectDepartment = async (req, res) => {
//   try {
//     const dept = await Department.findById(req.params.id);

//     if (!dept) return res.status(404).json({ message: "Department not found" });

//     dept.status = "disabled";

//     // ✅ Remove head if any
//     dept.deptHeadId = null;
//     dept.headsRequestedBy = [];

//     await dept.save();

//     res.json(dept);
//   } catch (err) {
//     console.error("rejectDepartment error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ✅ Approve Department Head Request (NEW - does not break old system)
// exports.approveHeadRequest = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // 1️⃣ Find user
//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     if (!user.departmentId)
//       return res
//         .status(400)
//         .json({ message: "User has no department request" });

//     const deptId = user.departmentId;

//     // 2️⃣ Approve selected user
//     user.requestStatus = "approved";
//     user.role = "department_head";
//     await user.save();

//     // 3️⃣ Assign department head
//     const department = await Department.findByIdAndUpdate(
//       deptId,
//       {
//         deptHeadId: user._id,
//         status: "active",
//       },
//       { new: true },
//     );

//     if (!department)
//       return res.status(404).json({ message: "Department not found" });

//     // 4️⃣ Reset ALL other pending users of same department
//     const resetResult = await User.updateMany(
//       {
//         departmentId: deptId,
//         requestStatus: "pending",
//         _id: { $ne: user._id },
//       },
//       {
//         $set: {
//           departmentId: null,
//           requestStatus: null,
//           role: "user",
//         },
//       },
//     );

//     console.log("Reset Users Count:", resetResult.modifiedCount);

//     res.json({
//       message: "Department head approved successfully",
//       resetCount: resetResult.modifiedCount,
//       user,
//       department,
//     });
//   } catch (error) {
//     console.error("Error approving head request:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };
// // ✅ Get full department details for modal
// // backend/controllers/departmentController.js
// exports.getDepartmentWithStaff = async (req, res) => {
//   try {
//     const { departmentId } = req.params;

//     // 1️⃣ Find department
//     const department = await Department.findById(departmentId)
//       .populate({
//         path: "workspaceId",
//         select: "workspaceName logo",
//       })
//       .populate({
//         path: "deptHeadId",
//         select: "name role",
//       })
//       .lean(); // lean() required for plain JS object

//     console.log(department);

//     if (!department) {
//       return res.status(404).json({ message: "Department not found" });
//     }

//     // 2️⃣ Get staff for this department
//     const staffDocs = await Staff.find({ departmentId })
//       .populate("userId", "name email role requestStatus")
//       .lean();

//     const staffMembers = staffDocs.map((s) => ({
//       _id: s.userId._id,
//       name: s.userId.name,
//       email: s.userId.email,
//       role: s.userId.role,
//       requestStatus: s.status === "active" ? "approved" : "pending",
//     }));

//     // 3️⃣ Send combined response
//   res.json({
//   ...department,
//   workspaceName: department.workspaceId?.workspaceName || "Workspace Not Assigned",
//   headName: department.deptHeadId?.name || "Not Assigned",
//   users: staffMembers,
// });
//   } catch (err) {
//     console.error("getDepartmentWithStaff error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };
// exports.getMyDepartment = async (req, res) => {
//   try {
//     const userId = req.user.id; // ⚠️ must come from auth middleware

//     const department = await Department.findOne({
//       deptHeadId: userId,
//     })
//       .populate({
//         path: "workspaceId",
//         select: "name logo status",
//       })
//       .populate({
//         path: "deptHeadId",
//         select: "name email role profileImage",
//       });

//     if (!department) {
//       return res.status(404).json({
//         message: "No department assigned to this head",
//       });
//     }

//     res.json({
//       department,
//     });
//   } catch (error) {
//     console.error("getMyDepartment error:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// // ===============================
// // ✅ Department Head Approve Staff
// // ===============================
// exports.sendStaffJoinRequest = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     if (user.staffId) {
//       return res.status(400).json({ message: "Already staff or pending" });
//     }

//     // 1️⃣ Create staff document with pending status
//     const newStaff = await Staff.create({
//       userId: user._id,
//       departmentId: req.body.departmentId,
//     });

//     // 2️⃣ Update user request status only
//     user.role = "staff"; // Ensure role stays user until approval
//     user.staffstatus = "pending";
//     await user.save();

//     res.json({ message: "Staff request sent successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ✅ Approve Staff Request
// exports.approveStaffRequest = async (req, res) => {
//   try {
//     const { staffId } = req.params;

//     const staff = await Staff.findById(staffId);

//     if (!staff) {
//       return res.status(404).json({ message: "Staff request not found" });
//     }

//     staff.status = "active";
//     await staff.save();

//     if (staff.userId) {
//       await User.findByIdAndUpdate(staff.userId, {
//         role: "staff",
//         staffstatus: "approved",
//         staffId: staff._id, // ✅ ADD STAFF ID HERE
//       });
//     }

//     res.json({ message: "Staff approved successfully" });
//   } catch (error) {
//     console.error("approveStaffRequest error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ❌ Reject Staff Request
// exports.rejectStaffRequest = async (req, res) => {
//   try {
//     const { staffId } = req.params;

//     const staff = await Staff.findById(staffId);

//     if (!staff) {
//       return res.status(404).json({
//         message: "Staff request not found",
//       });
//     }

//     const userId = staff.userId;

//     // ✅ Delete staff request
//     await Staff.findByIdAndDelete(staffId);

//     // ⭐ Reset user fields properly
//     if (userId) {
//       await User.findByIdAndUpdate(userId, {
//         staffId: null,
//         staffstatus: null,
//         role: "user",
//       });
//     }

//     res.json({
//       message: "Staff request rejected & removed",
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// exports.getDepartmentStaffOverview = async (req, res) => {
//   try {
//     const departmentHeadId = req.user.id;

//     const department = await Department.findOne({
//       deptHeadId: departmentHeadId,
//     });

//     if (!department) {
//       return res.status(404).json({
//         message: "Department not found",
//       });
//     }

//     const staffList = await Staff.find({
//       departmentId: department._id,
//     })
//       .populate("userId") // ✅ Full user data
//       .lean();

//     res.json(staffList);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };
// exports.getStaffOverview = async (req, res) => {
//   try {
//     const staffList = await Staff.find({})
//       .populate("userId", "name email age profileImage createdAt")
//       .populate("departmentId", "department")
//       .lean();

//     res.json(staffList);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };



//backend\controllers\departmentController.js
const User = require("../models/User");
const Department = require("../models/Department");
const Staff = require("../models/Staff");
// ✅ Get departments by workspace
exports.getDepartments = async (req, res) => {
  try {
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({
        message: "workspaceId is required",
      });
    }

    // ✅ Populate department head
    const departments = await Department.find({ workspaceId })
      .populate("deptHeadId", "name")
      .lean();

    // ✅ Create headName field for frontend
    const formattedDepartments = departments.map((d) => ({
      ...d,
      headName: d.deptHeadId?.name || null,
    }));

    res.status(200).json(formattedDepartments);
  } catch (err) {
    console.error("Get departments error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Create a new department
exports.createDepartment = async (req, res) => {
  const { department, head, employeesLimit, status, workspaceId } = req.body;

  if (!department || !workspaceId || employeesLimit === undefined) {
    return res.status(400).json({
      message: "Department, workspaceId, and employeesLimit are required",
    });
  }

  try {
    const newDept = await Department.create({
      department,
      head,
      employeesLimit, // ✅ correct field
      status: status || "disabled",
      workspaceId,
      deptHeadId: null,
    });

    res.status(201).json(newDept);
  } catch (err) {
    console.error("Create department error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Approve department (ONLY status change, no head assign)
exports.approveDepartment = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);

    if (!dept) return res.status(404).json({ message: "Department not found" });

    // ❌ If head not assigned, keep it pending (GM will approve user later)
    if (!dept.deptHeadId) {
      dept.status = "pending";
    } else {
      dept.status = "active";
    }

    await dept.save();

    res.json(dept);
  } catch (err) {
    console.error("approveDepartment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Reject department (disable + remove head)
exports.rejectDepartment = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);

    if (!dept) return res.status(404).json({ message: "Department not found" });

    dept.status = "disabled";

    // ✅ Remove head if any
    dept.deptHeadId = null;
    dept.headsRequestedBy = [];

    await dept.save();

    res.json(dept);
  } catch (err) {
    console.error("rejectDepartment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Approve Department Head Request (NEW - does not break old system)
exports.approveHeadRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1️⃣ Find user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.departmentId)
      return res
        .status(400)
        .json({ message: "User has no department request" });

    const deptId = user.departmentId;

    // 2️⃣ Approve selected user
    user.requestStatus = "approved";
    user.role = "department_head";
    await user.save();

    // 3️⃣ Assign department head
    const department = await Department.findByIdAndUpdate(
      deptId,
      {
        deptHeadId: user._id,
        status: "active",
      },
      { new: true },
    );

    if (!department)
      return res.status(404).json({ message: "Department not found" });

    // 4️⃣ Reset ALL other pending users of same department
    const resetResult = await User.updateMany(
      {
        departmentId: deptId,
        requestStatus: "pending",
        _id: { $ne: user._id },
      },
      {
        $set: {
          departmentId: null,
          requestStatus: null,
          role: "user",
        },
      },
    );

    console.log("Reset Users Count:", resetResult.modifiedCount);

    res.json({
      message: "Department head approved successfully",
      resetCount: resetResult.modifiedCount,
      user,
      department,
    });
  } catch (error) {
    console.error("Error approving head request:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get full department details for modal
exports.getDepartmentWithStaff = async (req, res) => {
  try {
    const { departmentId } = req.params;

    // 1️⃣ Find department
    const department = await Department.findById(departmentId)
      .populate({
        path: "workspaceId",
        select: "workspaceName logo",
      })
      .populate({
        path: "deptHeadId",
        select: "name role",
      })
      .lean();

    console.log(department);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    // 2️⃣ Get staff for this department
    const staffDocs = await Staff.find({ departmentId })
      .populate("userId", "name email role requestStatus")
      .lean();

    const staffMembers = staffDocs.map((s) => ({
      _id: s.userId._id,
      name: s.userId.name,
      email: s.userId.email,
      role: s.userId.role,
      requestStatus: s.status === "active" ? "approved" : "pending",
    }));

    // 3️⃣ Send combined response
    res.json({
      ...department,
      workspaceName: department.workspaceId?.workspaceName || "Workspace Not Assigned",
      headName: department.deptHeadId?.name || "Not Assigned",
      users: staffMembers,
    });
  } catch (err) {
    console.error("getDepartmentWithStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyDepartment = async (req, res) => {
  try {
    // ✅ FIX: was req.user.id — auth middleware sets req.userId not req.user
    const userId = req.userId;

    // ✅ Strategy 1: user is a department head — find department where deptHeadId matches
    let department = await Department.findOne({ deptHeadId: userId })
      .populate({ path: "workspaceId", select: "name logo status" })
      .populate({ path: "deptHeadId", select: "name email role profileImage" });

    // ✅ Strategy 2: user is staff — find via Staff model → departmentId
    // HR staff users land here because they are not department heads
    if (!department) {
      const staffDoc = await Staff.findOne({ userId }).lean();
      if (staffDoc?.departmentId) {
        department = await Department.findById(staffDoc.departmentId)
          .populate({ path: "workspaceId", select: "name logo status" })
          .populate({ path: "deptHeadId", select: "name email role profileImage" });
      }
    }

    // ✅ Strategy 3: user has departmentId set directly on their user document
    if (!department) {
      const user = await User.findById(userId).select("departmentId").lean();
      if (user?.departmentId) {
        department = await Department.findById(user.departmentId)
          .populate({ path: "workspaceId", select: "name logo status" })
          .populate({ path: "deptHeadId", select: "name email role profileImage" });
      }
    }

    if (!department) {
      return res.status(404).json({
        message: "No department assigned to this user",
      });
    }

    res.json({ department });
  } catch (error) {
    console.error("getMyDepartment error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ===============================
// ✅ Department Head Approve Staff
// ===============================
exports.sendStaffJoinRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.staffId) {
      return res.status(400).json({ message: "Already staff or pending" });
    }

    // 1️⃣ Create staff document with pending status
    const newStaff = await Staff.create({
      userId: user._id,
      departmentId: req.body.departmentId,
    });

    // 2️⃣ Update user request status only
    user.role = "staff"; // Ensure role stays user until approval
    user.staffstatus = "pending";
    await user.save();

    res.json({ message: "Staff request sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Approve Staff Request
exports.approveStaffRequest = async (req, res) => {
  try {
    const { staffId } = req.params;

    const staff = await Staff.findById(staffId);

    if (!staff) {
      return res.status(404).json({ message: "Staff request not found" });
    }

    staff.status = "active";
    await staff.save();

    if (staff.userId) {
      await User.findByIdAndUpdate(staff.userId, {
        role: "staff",
        staffstatus: "approved",
        staffId: staff._id, // ✅ ADD STAFF ID HERE
      });
    }

    res.json({ message: "Staff approved successfully" });
  } catch (error) {
    console.error("approveStaffRequest error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ❌ Reject Staff Request
exports.rejectStaffRequest = async (req, res) => {
  try {
    const { staffId } = req.params;

    const staff = await Staff.findById(staffId);

    if (!staff) {
      return res.status(404).json({
        message: "Staff request not found",
      });
    }

    const userId = staff.userId;

    // ✅ Delete staff request
    await Staff.findByIdAndDelete(staffId);

    // ⭐ Reset user fields properly
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        staffId: null,
        staffstatus: null,
        role: "user",
      });
    }

    res.json({
      message: "Staff request rejected & removed",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getDepartmentStaffOverview = async (req, res) => {
  try {
    const departmentHeadId = req.user.id;

    const department = await Department.findOne({
      deptHeadId: departmentHeadId,
    });

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    const staffList = await Staff.find({
      departmentId: department._id,
    })
      .populate("userId") // ✅ Full user data
      .lean();

    res.json(staffList);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getStaffOverview = async (req, res) => {
  try {
    const staffList = await Staff.find({})
      .populate("userId", "name email age profileImage createdAt")
      .populate("departmentId", "department")
      .lean();

    res.json(staffList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
