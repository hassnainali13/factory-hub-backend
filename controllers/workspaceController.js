//backend\controllers\workspaceController.js

const mongoose = require("mongoose");
const Workspace = require("../models/Workspace");
const User = require("../models/User");
const { cloudinary } = require("../config/cloudinary"); // Cloudinary import


// The rest of your controller stays exactly the same

exports.createWorkspace = async (req, res) => {
  try {
    // 1️⃣ Ensure user is logged in
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    const { workspaceName, workspaceCode, role } = req.body;

    // 2️⃣ Validate required fields
    if (!workspaceName || !workspaceCode || !role) {
      return res
        .status(400)
        .json({ message: "Workspace name, code, and role are required" });
    }

    console.log("Creating workspace for user:", req.userId);

    // 3️⃣ Check if user exists
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 4️⃣ Check if workspace code already exists
    const existingWorkspace = await Workspace.findOne({ code: workspaceCode });
    if (existingWorkspace) {
      return res.status(400).json({ message: "Workspace code already exists" });
    }

    // 5️⃣ Normalize role
    const validRoles = ["general_manager", "industry_head"];
    const userRole = role.toLowerCase();
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    // 6️⃣ Handle Workspace Logo Upload
    let logoUrl = null;
    if (req.file) {
      // ✅ req.file.path comes from multer-storage-cloudinary
      logoUrl = req.file.path;
    }

    // 7️⃣ Create Workspace
    const workspace = await Workspace.create({
      name: workspaceName,
      code: workspaceCode,
      status: "pending",
      createdBy: req.userId,
      workspaceRole: userRole,
      logo: logoUrl, // ✅ Save Cloudinary URL
    });

    // 8️⃣ Assign workspace & role to user
    user.workspaceId = workspace._id;
    user.role = userRole;
    await user.save();

    // 9️⃣ Send response
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
