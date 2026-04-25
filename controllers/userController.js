// // const User = require("../models/User");
// // const bcrypt = require("bcryptjs");
// // const crypto = require("crypto");
// // const path = require("path");
// // const fs = require("fs");

// // // =======================
// // // Get current user profile
// // // =======================
// // exports.getProfile = async (req, res) => {
// //   try {
// //     const user = await User.findById(req.userId)
// //       .select("-password")
// //       .populate("workspaceId", "name logo")
// //       .populate("departmentId", "department");

// //     if (!user) return res.status(404).json({ message: "User not found" });
// //     res.json(user);
// //   } catch (err) {
// //     console.error("Get profile error:", err);
// //     res.status(500).json({ message: "Server error" });
// //   }
// // };

// // // =======================
// // // Update profile (name, email, profileImage)
// // // =======================
// // // updateProfile

// // exports.updateProfile = async (req, res) => {
// //   try {
// //     console.log("req.file:", req.file); // DEBUG

// //     const { name, email } = req.body;

// //     const user = await User.findById(req.userId);
// //     if (!user) return res.status(404).json({ message: "User not found" });

// //     if (name) user.name = name;
// //     if (email) user.email = email;

// //     // ✅ FIXED (Cloudinary URL)
// //     if (req.file) {
// //       user.profileImage = req.file.path; // 🔥 IMPORTANT
// //     }

// //     await user.save();

// //     res.json({
// //       message: "Profile updated successfully",
// //       user,
// //     });
// //   } catch (err) {
// //     console.error("Update profile error:", err);
// //     res.status(500).json({ message: err.message }); // show real error
// //   }
// // };

// // // =======================
// // // Change password
// // // =======================
// // exports.changePassword = async (req, res) => {
// //   try {
// //     const { oldPassword, newPassword } = req.body;
// //     const user = await User.findById(req.userId);
// //     if (!user) return res.status(404).json({ message: "User not found" });

// //     const isMatch = await bcrypt.compare(oldPassword, user.password);
// //     if (!isMatch)
// //       return res.status(400).json({ message: "Old password incorrect" });

// //     const salt = await bcrypt.genSalt(10);
// //     user.password = await bcrypt.hash(newPassword, salt);
// //     await user.save();

// //     res.json({ message: "Password updated successfully" });
// //   } catch (err) {
// //     console.error("Change password error:", err);
// //     res.status(500).json({ message: "Server error" });
// //   }
// // };

// // // =======================
// // // Request password reset (generate token)
// // // =======================
// // exports.requestPasswordReset = async (req, res) => {
// //   try {
// //     const { email } = req.body;
// //     const user = await User.findOne({ email });
// //     if (!user) return res.status(404).json({ message: "User not found" });

// //     const token = crypto.randomBytes(20).toString("hex");
// //     user.resetToken = token;
// //     user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
// //     await user.save();

// //     // TODO: send token via email
// //     console.log("Password reset token:", token);

// //     res.json({ message: "Password reset token generated", token });
// //   } catch (err) {
// //     console.error("Request password reset error:", err);
// //     res.status(500).json({ message: "Server error" });
// //   }
// // };

// // // =======================
// // // Reset password using token
// // // =======================
// // exports.resetPassword = async (req, res) => {
// //   try {
// //     const { token, newPassword } = req.body;
// //     const user = await User.findOne({
// //       resetToken: token,
// //       resetTokenExpiry: { $gt: Date.now() },
// //     });
// //     if (!user)
// //       return res.status(400).json({ message: "Invalid or expired token" });

// //     const salt = await bcrypt.genSalt(10);
// //     user.password = await bcrypt.hash(newPassword, salt);
// //     user.resetToken = null;
// //     user.resetTokenExpiry = null;

// //     await user.save();
// //     res.json({ message: "Password reset successfully" });
// //   } catch (err) {
// //     console.error("Reset password error:", err);
// //     res.status(500).json({ message: "Server error" });
// //   }
// // };

// // // =======================
// // // Get all pending users (for DepartmentHeadRequestsList)
// // // =======================
// // exports.getPendingUsers = async (req, res) => {
// //   try {
// //     const users = await User.find()
// //       .populate("workspaceId", "name logo")
// //       .populate("departmentId", "department head deptHeadId");

// //     const pendingRequests = users.filter((u) => u.requestStatus === "pending");

// //     res.json(pendingRequests);
// //   } catch (err) {
// //     console.error("Error fetching pending users:", err);
// //     res.status(500).json({ message: "Server error" });
// //   }
// // };


// // // =======================
// // // GET /users/workspace-users
// // // HR Dashboard ke liye — same workspace ke sare users
// // // =======================
// // exports.getWorkspaceUsers = async (req, res) => {
// //   try {
// //     const currentUser = await User.findById(req.userId)
// //       .populate({
// //         path: "departmentId",
// //         select: "workspaceId department",
// //       });

// //     if (!currentUser) {
// //       return res.status(404).json({ message: "User not found" });
// //     }

// //     // workspace id nikalo — department se
// //     const workspaceId = currentUser.departmentId?.workspaceId;

// //     if (!workspaceId) {
// //       return res.status(400).json({ message: "Workspace not found for this user" });
// //     }

// //     // 3 types ke users fetch karo same workspace se

// //     // Type 1 — Direct workspace users (workspaceId match)
// //     const directUsers = await User.find({
// //       workspaceId: workspaceId,
// //       _id: { $ne: currentUser._id },
// //     })
// //       .populate("departmentId", "department head")
// //       .select("-password -resetToken -resetTokenExpiry -otp -otpExpiry -faceDescriptor")
// //       .lean();

// //     // Type 2 — Department users (departmentId → workspaceId match)
// //     const Department = require("../models/Department");
// //     const depts = await Department.find({ workspaceId }).select("_id").lean();
// //     const deptIds = depts.map((d) => d._id);

// //     const deptUsers = await User.find({
// //       departmentId: { $in: deptIds },
// //       _id: { $ne: currentUser._id },
// //     })
// //       .populate("departmentId", "department head")
// //       .select("-password -resetToken -resetTokenExpiry -otp -otpExpiry -faceDescriptor")
// //       .lean();

// //     // Type 3 — Staff users (staffId → departmentId → workspaceId match)
// //     const Staff = require("../models/Staff");
// //     const staffDocs = await Staff.find({
// //       departmentId: { $in: deptIds },
// //     }).select("userId").lean();

// //     const staffUserIds = staffDocs.map((s) => s.userId);

// //     const staffUsers = await User.find({
// //       _id: { $in: staffUserIds, $ne: currentUser._id },
// //     })
// //       .populate("departmentId", "department head")
// //       .select("-password -resetToken -resetTokenExpiry -otp -otpExpiry -faceDescriptor")
// //       .lean();

// //     // Merge + deduplicate by _id
// //     const allUsersMap = new Map();

// //     [...directUsers, ...deptUsers, ...staffUsers].forEach((u) => {
// //       allUsersMap.set(u._id.toString(), u);
// //     });

// //     const users = Array.from(allUsersMap.values());

// //     res.json({ users });
// //   } catch (err) {
// //     console.error("getWorkspaceUsers error:", err);
// //     res.status(500).json({ message: "Server error" });
// //   }
// // };



// const User = require("../models/User");
// const bcrypt = require("bcryptjs");
// const crypto = require("crypto");
// const path = require("path");
// const fs = require("fs");

// // =======================
// // Get current user profile
// // =======================
// exports.getProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.userId)
//       .select("-password")
//       .populate("workspaceId", "name logo")
//       .populate("departmentId", "department");

//     if (!user) return res.status(404).json({ message: "User not found" });
//     res.json(user);
//   } catch (err) {
//     console.error("Get profile error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // =======================
// // Update profile (name, email, profileImage)
// // =======================
// exports.updateProfile = async (req, res) => {
//   try {
//     console.log("req.file:", req.file); // DEBUG

//     const { name, email } = req.body;

//     const user = await User.findById(req.userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     if (name) user.name = name;
//     if (email) user.email = email;

//     // ✅ FIXED (Cloudinary URL)
//     if (req.file) {
//       user.profileImage = req.file.path; // 🔥 IMPORTANT
//     }

//     await user.save();

//     res.json({
//       message: "Profile updated successfully",
//       user,
//     });
//   } catch (err) {
//     console.error("Update profile error:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// // =======================
// // Change password
// // =======================
// exports.changePassword = async (req, res) => {
//   try {
//     const { oldPassword, newPassword } = req.body;
//     const user = await User.findById(req.userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const isMatch = await bcrypt.compare(oldPassword, user.password);
//     if (!isMatch)
//       return res.status(400).json({ message: "Old password incorrect" });

//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(newPassword, salt);
//     await user.save();

//     res.json({ message: "Password updated successfully" });
//   } catch (err) {
//     console.error("Change password error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // =======================
// // Request password reset (generate token)
// // =======================
// exports.requestPasswordReset = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const token = crypto.randomBytes(20).toString("hex");
//     user.resetToken = token;
//     user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
//     await user.save();

//     // TODO: send token via email
//     console.log("Password reset token:", token);

//     res.json({ message: "Password reset token generated", token });
//   } catch (err) {
//     console.error("Request password reset error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // =======================
// // Reset password using token
// // =======================
// exports.resetPassword = async (req, res) => {
//   try {
//     const { token, newPassword } = req.body;
//     const user = await User.findOne({
//       resetToken: token,
//       resetTokenExpiry: { $gt: Date.now() },
//     });
//     if (!user)
//       return res.status(400).json({ message: "Invalid or expired token" });

//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(newPassword, salt);
//     user.resetToken = null;
//     user.resetTokenExpiry = null;

//     await user.save();
//     res.json({ message: "Password reset successfully" });
//   } catch (err) {
//     console.error("Reset password error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // =======================
// // Get all pending users (for DepartmentHeadRequestsList)
// // =======================
// exports.getPendingUsers = async (req, res) => {
//   try {
//     const users = await User.find()
//       .populate("workspaceId", "name logo")
//       .populate("departmentId", "department head deptHeadId");

//     const pendingRequests = users.filter((u) => u.requestStatus === "pending");

//     res.json(pendingRequests);
//   } catch (err) {
//     console.error("Error fetching pending users:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// // =======================
// // GET /users/workspace-users
// // HR Dashboard ke liye — same workspace ke sare users
// // =======================
// exports.getWorkspaceUsers = async (req, res) => {
//   try {
//     const Department = require("../models/Department");
//     const Staff = require("../models/Staff");

//     const currentUser = await User.findById(req.userId)
//       .populate({
//         path: "departmentId",
//         select: "workspaceId department",
//       })
//       .populate({
//         path: "staffId",
//         populate: { path: "departmentId", select: "workspaceId department" },
//       });

//     if (!currentUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // ✅ Strategy 1: workspaceId directly on user
//     let workspaceId = currentUser.workspaceId;

//     // ✅ Strategy 2: through departmentId.workspaceId
//     if (!workspaceId) {
//       workspaceId = currentUser.departmentId?.workspaceId;
//     }

//     // ✅ Strategy 3: through staffId → departmentId → workspaceId
//     // HR staff users have staffId set — trace through it
//     if (!workspaceId && currentUser.staffId) {
//       const staffDoc = await Staff.findById(currentUser.staffId)
//         .populate({ path: "departmentId", select: "workspaceId" })
//         .lean();
//       workspaceId = staffDoc?.departmentId?.workspaceId;
//     }

//     // ✅ Strategy 4: look up Staff collection directly by userId
//     if (!workspaceId) {
//       const staffDoc = await Staff.findOne({ userId: currentUser._id })
//         .populate({ path: "departmentId", select: "workspaceId" })
//         .lean();
//       workspaceId = staffDoc?.departmentId?.workspaceId;
//     }

//     if (!workspaceId) {
//       return res.status(400).json({ message: "Workspace not found for this user" });
//     }

//     // Type 1 — Direct workspace users (workspaceId match)
//     const directUsers = await User.find({
//       workspaceId: workspaceId,
//       _id: { $ne: currentUser._id },
//     })
//       .populate("departmentId", "department head")
//       .select("-password -resetToken -resetTokenExpiry -otp -otpExpiry -faceDescriptor")
//       .lean();

//     // Type 2 — Department users (departmentId → workspaceId match)
//     const depts = await Department.find({ workspaceId }).select("_id").lean();
//     const deptIds = depts.map((d) => d._id);

//     const deptUsers = await User.find({
//       departmentId: { $in: deptIds },
//       _id: { $ne: currentUser._id },
//     })
//       .populate("departmentId", "department head")
//       .select("-password -resetToken -resetTokenExpiry -otp -otpExpiry -faceDescriptor")
//       .lean();

//     // Type 3 — Staff users (staffId → departmentId → workspaceId match)
//     const staffDocs = await Staff.find({
//       departmentId: { $in: deptIds },
//     }).select("userId").lean();

//     const staffUserIds = staffDocs.map((s) => s.userId);

//     const staffUsers = await User.find({
//       _id: { $in: staffUserIds, $ne: currentUser._id },
//     })
//       .populate("departmentId", "department head")
//       .select("-password -resetToken -resetTokenExpiry -otp -otpExpiry -faceDescriptor")
//       .lean();

//     // Merge + deduplicate by _id
//     const allUsersMap = new Map();

//     [...directUsers, ...deptUsers, ...staffUsers].forEach((u) => {
//       allUsersMap.set(u._id.toString(), u);
//     });

//     const users = Array.from(allUsersMap.values());

//     res.json({ users });
//   } catch (err) {
//     console.error("getWorkspaceUsers error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// =======================
// Get current user profile
// =======================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-password")
      .populate("workspaceId", "name logo")
      .populate("departmentId", "department");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// Update profile (name, email, profileImage)
// =======================
exports.updateProfile = async (req, res) => {
  try {
    console.log("req.file:", req.file);

    const { name, email } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email;

    if (req.file) {
      user.profileImage = req.file.path;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: err.message });
  }
};

// =======================
// Change password
// =======================
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Old password incorrect" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// Request password reset
// =======================
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(20).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();

    console.log("Password reset token:", token);
    res.json({ message: "Password reset token generated", token });
  } catch (err) {
    console.error("Request password reset error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// Reset password using token
// =======================
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await user.save();
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// Get all pending users
// =======================
exports.getPendingUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate("workspaceId", "name logo")
      .populate("departmentId", "department head deptHeadId");

    const pendingRequests = users.filter((u) => u.requestStatus === "pending");
    res.json(pendingRequests);
  } catch (err) {
    console.error("Error fetching pending users:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// GET /users/workspace-users
// HR Staff Dashboard ke liye — same workspace ke sare users
// ✅ Aggregate version — staff ke liye staffDepartment se departmentInfo resolve hoti hai
// =======================
exports.getWorkspaceUsers = async (req, res) => {
  try {
    const Department = require("../models/Department");
    const Staff = require("../models/Staff");

    const currentUser = await User.findById(req.userId)
      .populate({ path: "departmentId", select: "workspaceId department" })
      .populate({
        path: "staffId",
        populate: { path: "departmentId", select: "workspaceId department" },
      });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ workspaceId resolve karo — 4 strategies
    let workspaceId = currentUser.workspaceId;

    if (!workspaceId) {
      workspaceId = currentUser.departmentId?.workspaceId;
    }

    if (!workspaceId && currentUser.staffId) {
      const staffDoc = await Staff.findById(currentUser.staffId)
        .populate({ path: "departmentId", select: "workspaceId" })
        .lean();
      workspaceId = staffDoc?.departmentId?.workspaceId;
    }

    if (!workspaceId) {
      const staffDoc = await Staff.findOne({ userId: currentUser._id })
        .populate({ path: "departmentId", select: "workspaceId" })
        .lean();
      workspaceId = staffDoc?.departmentId?.workspaceId;
    }

    if (!workspaceId) {
      return res
        .status(400)
        .json({ message: "Workspace not found for this user" });
    }

    const workspaceObjectId = new mongoose.Types.ObjectId(
      workspaceId.toString(),
    );

    // ✅ Aggregate — same logic as getAllUsersInWorkspace
    const users = await User.aggregate([
      // Step 1: department lookup for department_head/admin users
      {
        $lookup: {
          from: "departments",
          localField: "departmentId",
          foreignField: "_id",
          as: "departmentInfo",
        },
      },
      {
        $unwind: {
          path: "$departmentInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Step 2: staff lookup
      {
        $lookup: {
          from: "staffs",
          localField: "staffId",
          foreignField: "_id",
          as: "staff",
        },
      },
      {
        $unwind: {
          path: "$staff",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Step 3: staff ka department lookup
      {
        $lookup: {
          from: "departments",
          localField: "staff.departmentId",
          foreignField: "_id",
          as: "staffDepartment",
        },
      },
      {
        $unwind: {
          path: "$staffDepartment",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Step 4: workspace ke andar sirf match karo
      {
        $match: {
          _id: { $ne: currentUser._id },
          $or: [
            { workspaceId: workspaceObjectId },
            { "departmentInfo.workspaceId": workspaceObjectId },
            { "staffDepartment.workspaceId": workspaceObjectId },
          ],
        },
      },
      // Step 5: fields resolve karo
      {
        $addFields: {
          originalRole: "$role",
          resolvedRole: {
            $cond: {
              if: {
                $and: [
                  { $eq: ["$role", "department_head"] },
                  {
                    $gt: [{ $ifNull: ["$departmentInfo.head", null] }, null],
                  },
                ],
              },
              then: "$departmentInfo.head",
              else: "$role",
            },
          },
          departmentId: {
            $cond: {
              if: { $gt: [{ $ifNull: ["$departmentInfo._id", null] }, null] },
              then: {
                _id: "$departmentInfo._id",
                name: "$departmentInfo.department",
                head: "$departmentInfo.head",
              },
              else: null,
            },
          },
          // ✅ KEY: staff ke liye staffDepartment se, baqi ke liye departmentInfo se
          resolvedDepartmentInfo: {
            $cond: {
              if: { $eq: ["$role", "staff"] },
              then: {
                $cond: {
                  if: {
                    $gt: [{ $ifNull: ["$staffDepartment._id", null] }, null],
                  },
                  then: {
                    _id: "$staffDepartment._id",
                    name: "$staffDepartment.department",
                    head: "$staffDepartment.head",
                  },
                  else: null,
                },
              },
              else: {
                $cond: {
                  if: {
                    $gt: [{ $ifNull: ["$departmentInfo._id", null] }, null],
                  },
                  then: {
                    _id: "$departmentInfo._id",
                    name: "$departmentInfo.department",
                    head: "$departmentInfo.head",
                  },
                  else: null,
                },
              },
            },
          },
        },
      },
      // Step 6: sensitive fields hatao
      {
        $project: {
          password: 0,
          faceDescriptor: 0,
          resetToken: 0,
          resetTokenExpiry: 0,
          otp: 0,
          otpExpiry: 0,
          staff: 0,
          staffDepartment: 0,
          departmentInfo: 0,
        },
      },
    ]);

    // ✅ resolvedDepartmentInfo ko departmentInfo naam se bhejo
    const finalUsers = users.map((user) => ({
      ...user,
      role: user.resolvedRole ?? user.role,
      originalRole: user.originalRole,
      departmentInfo: user.resolvedDepartmentInfo || null,
      resolvedRole: undefined,
      resolvedDepartmentInfo: undefined,
    }));

    res.json({ users: finalUsers });
  } catch (err) {
    console.error("getWorkspaceUsers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};