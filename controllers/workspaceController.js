//backend\controllers\workspaceController.js

const mongoose = require("mongoose");
const Workspace = require("../models/Workspace");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary"); // ✅ Add this

// exports.createWorkspace = async (req, res) => {
//   try {
//     // Ensure user is logged in
//     if (!req.userId) {
//       return res.status(401).json({ message: "Unauthorized. Please log in." });
//     }

//     // Destructure the body to extract workspace details
//     const { workspaceName, workspaceCode, role } = req.body;

//     // Validate input fields
//     if (!workspaceName || !workspaceCode || !role) {
//       return res
//         .status(400)
//         .json({ message: "Workspace name, code, and role are required" });
//     }

//     console.log("Creating workspace for user:", req.userId);

//     // Check if user exists
//     const user = await User.findById(req.userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Check if workspace code already exists
//     const existingWorkspace = await Workspace.findOne({ code: workspaceCode });
//     if (existingWorkspace) {
//       return res.status(400).json({ message: "Workspace code already exists" });
//     }

//     // Create workspace
//     const workspace = await Workspace.create({
//       name: workspaceName,
//       code: workspaceCode,
//       status: "pending",
//       createdBy: req.userId,
//       logo: req.file?.path || null,
//       workspaceRole: role,
//     });

//     // Link workspace to user and assign role
//     user.workspaceId = workspace._id; // Assign workspace to user
//     user.role = role; // Assign the role to the user
//     await user.save();

//     // ✅ Convert to plain object before sending to avoid 500
//     const workspaceObj = workspace.toObject();

//     // Return success response with workspace details
//     res.status(201).json({
//       message: "Workspace created successfully and role assigned to user",
//       workspace: workspaceObj,
//     });
//   } catch (error) {
//     console.error("Workspace creation error:", error);
//     res.status(500).json({ message: "Server error while creating workspace" });
//   }
// };

// The rest of your controller stays exactly the same

exports.createWorkspace = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    const { workspaceName, workspaceCode, role } = req.body;

    if (!workspaceName || !workspaceCode || !role) {
      return res
        .status(400)
        .json({ message: "Workspace name, code, and role are required" });
    }

    console.log("Creating workspace for user:", req.userId);

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const existingWorkspace = await Workspace.findOne({ code: workspaceCode });
    if (existingWorkspace) {
      return res.status(400).json({ message: "Workspace code already exists" });
    }

    // ✅ Normalize role
    const validRoles = ["general_manager", "industry_head"];
    const userRole = role.toLowerCase();
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    let logoUrl = null;

    if (req.file) {
      // ✅ Upload new logo to Cloudinary (already done by multer-storage-cloudinary)
      logoUrl = req.file.path;

      // Optional: Delete old workspace logo if exists
      // (useful if you implement workspace update later)
    }

    const workspace = await Workspace.create({
      name: workspaceName,
      code: workspaceCode,
      status: "pending",
      createdBy: req.userId,
      workspaceRole: userRole,
      logo: logoUrl,
    });

    user.workspaceId = workspace._id;
    user.role = userRole;
    await user.save();

    const workspaceObj = workspace.toObject();

    res.status(201).json({
      message: "Workspace created successfully and role assigned to user",
      workspace: workspaceObj,
    });
  } catch (error) {
    console.error("Workspace creation error:", error);
    res.status(500).json({ message: "Server error while creating workspace" });
  }
};

exports.requestWorkspace = async (req, res) => {
  try {
    const { userId, workspaceName, workspaceCode } = req.body;

    // Validate input fields
    if (!userId || !workspaceName || !workspaceCode) {
      return res
        .status(400)
        .json({ message: "User ID, workspace name, and code are required" });
    }

    // Check if workspace code already exists
    const exists = await Workspace.findOne({ code: workspaceCode });
    if (exists) {
      return res.status(400).json({ message: "Workspace code already exists" });
    }

    // Create the workspace and set its status as pending
    const workspace = await Workspace.create({
      name: workspaceName,
      code: workspaceCode,
      status: "pending", // Workspace status set to pending
      createdBy: userId, // User ID who is requesting
    });

    // Update the user's role to admin and assign the workspace ID
    await User.findByIdAndUpdate(userId, {
      role: "admin", // Set user role to admin
      workspaceId: workspace._id,
    });

    res.status(201).json({
      message: "Workspace request submitted. Waiting for approval.",
      workspace,
    });
  } catch (error) {
    console.error("Workspace request error:", error);
    res
      .status(500)
      .json({ message: "Server error while processing workspace request" });
  }
};

exports.joinWorkspace = async (req, res) => {
  try {
    const { userId, workspaceCode } = req.body;

    // Validate input fields
    if (!userId || !workspaceCode) {
      return res
        .status(400)
        .json({ message: "User ID and workspace code are required" });
    }

    const workspace = await Workspace.findOne({
      code: { $regex: `^${workspaceCode}$`, $options: "i" }, // case-insensitive
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (workspace.status !== "active") {
      return res.status(400).json({ message: "Workspace is not active yet" });
    }

    // Update user's role to "user" and link them to the workspace
    await User.findByIdAndUpdate(userId, {
      role: "user", // Set user role to user when joining workspace
      workspaceId: workspace._id,
    });

    res.status(200).json({
      message: "Joined workspace successfully",
      workspaceId: workspace._id,
    });
  } catch (error) {
    console.error("Join workspace error:", error);
    res.status(500).json({ message: "Server error while joining workspace" });
  }
};

// GET all workspaces
// GET all workspaces
exports.getAllWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find()
      .populate("createdBy", "name email role") // 👈 yahan se userEmail ayega
      .sort({ createdAt: -1 });

    const formatted = await Promise.all(
      workspaces.map(async (ws) => {
        const employees = await User.countDocuments({ workspaceId: ws._id });

        return {
          _id: ws._id,

          // Workspace info
          workspaceName: ws.name,
          code: ws.code,
          logo: ws.logo || null,
          status: ws.status,

          // Workspace role (from workspace schema)
          workspaceRole: ws.workspaceRole || null,

          // Creator info
          userName: ws.createdBy?.name || "N/A",
          userEmail: ws.createdBy?.email || "N/A",
          userRole: ws.createdBy?.role || "N/A",

          employees,
        };
      }),
    );

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Get workspaces error:", error);
    res.status(500).json({ message: "Server error while fetching workspaces" });
  }
};
exports.getWorkspaceDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findById(id).populate(
      "createdBy",
      "name email role",
    );

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.status(200).json({
      _id: workspace._id,
      workspaceName: workspace.name,
      code: workspace.code,
      logo: workspace.logo,
      status: workspace.status,
      workspaceRole: workspace.workspaceRole,

      userName: workspace.createdBy?.name || "N/A",
      userEmail: workspace.createdBy?.email || "N/A",
      userRole: workspace.createdBy?.role || "N/A",
    });
  } catch (error) {
    console.error("Workspace detail error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
