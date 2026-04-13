// backend/controllers/authController.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Workspace = require("../models/Workspace");

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;

// ✅ Create JWT token
const createToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ==========================
// REGISTER
// ==========================
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (email === SUPERADMIN_EMAIL) {
      return res.status(400).json({
        message: "Super Admin already exists, cannot register again.",
      });
    }

    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ message: "Email already exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash,
      role: role || "user",
      isApproved: role === "admin" ? false : true,
    });

    res.status(201).json({
      message: "Registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// LOGIN
// ==========================
// ==========================
// LOGIN
// ==========================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // SUPERADMIN LOGIN
    if (email === SUPERADMIN_EMAIL) {
      if (password === SUPERADMIN_PASSWORD) {
        const token = createToken({
          userId: "superadmin",
          role: "superadmin",
          email,
        });

        return res.json({
          message: "Login success",
          token,
          user: { email, role: "superadmin" },
        });
      } else {
        return res
          .status(400)
          .json({ message: "Invalid password for Superadmin." });
      }
    }

    // 🔥 ADD THESE (NO BREAKING CHANGE)
    const Staff = require("../models/Staff");
    const Department = require("../models/Department");

    // NORMAL USER LOGIN
    const user = await User.findOne({ email })
      .populate("workspaceId")
      .populate("departmentId");

    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    // 🔥 RESOLVE WORKSPACE (MAIN FIX)
    let workspaceId = user.workspaceId?._id || user.workspaceId;

    // Department Head case
    if (!workspaceId && user.departmentId) {
      workspaceId = user.departmentId.workspaceId;
    }

    // Staff case (IMPORTANT FIX)
    if (!workspaceId && user.staffId) {
      const staff = await Staff.findById(user.staffId);

      if (staff?.departmentId) {
        const dept = await Department.findById(staff.departmentId);
        workspaceId = dept?.workspaceId;
      }
    }

    // ✅ Create token (optional improvement)
    const token = createToken({
      userId: user._id,
      role: user.role,
      email,
      workspaceId: workspaceId || null,
    });

    res.json({
      message: "Login success",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,

        // 🔥 FIXED WORKSPACE
        workspaceId: workspaceId || null,

        workspaceStatus: user.workspaceId?.status || null,
        workspaceName: user.workspaceId?.name || null,
        workspaceLogo: user.workspaceId?.logo || null,

        requestStatus: user.requestStatus || null,
        departmentId: user.departmentId || null,

        staffstatus: user.staffstatus || null,
        staffId: user.staffId || null,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
