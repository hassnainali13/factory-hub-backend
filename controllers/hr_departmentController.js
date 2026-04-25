const mongoose = require("mongoose");
const User = require("../models/User");

exports.getAllUsersInWorkspace = async (req, res) => {
  try {
    const hrUserId = req.user.id;

    const hrUser = await User.findById(hrUserId).populate("departmentId");
    if (!hrUser || !hrUser.departmentId) {
      return res
        .status(400)
        .json({ message: "HR user not assigned to a department" });
    }

    const workspaceId = hrUser.departmentId.workspaceId;
    if (!workspaceId) {
      return res
        .status(400)
        .json({ message: "Department not assigned to a workspace" });
    }

    const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);

    const users = await User.aggregate([
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
      {
        $match: {
          $or: [
            { workspaceId: workspaceObjectId },
            { "departmentInfo.workspaceId": workspaceObjectId },
            { "staffDepartment.workspaceId": workspaceObjectId },
          ],
        },
      },
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
          // ✅ staff ke liye staffDepartment se departmentInfo set karo
          // department_head/admin ke liye departmentInfo se
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
          departmentInfo: 0,       // raw hatao
          // ✅ resolvedDepartmentInfo project mein explicitly nahi likhna — by default aayegi
        },
      },
    ]);

    const finalUsers = users.map((user) => ({
      ...user,
      role: user.resolvedRole ?? user.role,
      originalRole: user.originalRole,
      // ✅ resolvedDepartmentInfo ko departmentInfo naam se bhejo frontend ko
      departmentInfo: user.resolvedDepartmentInfo || null,
      resolvedRole: undefined,
      resolvedDepartmentInfo: undefined,
    }));

    res.status(200).json({ users: finalUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};