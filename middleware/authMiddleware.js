

// backend\middleware\authMiddleware.js

const User = require("../models/User");
const Department = require("../models/Department");
const Staff = require("../models/Staff");
const jwt = require("jsonwebtoken");

/**
 * ======================================
 * 🔥 NEW: WORKSPACE RESOLVER (ADDED ONLY)
 * ======================================
 */
const resolveWorkspaceId = async (userId) => {
  try {
    const user = await User.findById(userId)
      .populate("departmentId")
      .populate("workspaceId");

    if (!user) return null;

    // 1. direct workspace
    if (user.workspaceId?._id) {
      return user.workspaceId._id;
    }

    // 2. department → workspace
    if (user.departmentId) {
      const dept = await Department.findById(user.departmentId);
      if (dept?.workspaceId) return dept.workspaceId;
    }

    // 3. staff → department → workspace
    if (user.staffId) {
      const staff = await Staff.findById(user.staffId);

      if (staff?.departmentId) {
        const dept = await Department.findById(staff.departmentId);
        if (dept?.workspaceId) return dept.workspaceId;
      }
    }

    return null;
  } catch (err) {
    console.error("Workspace resolve error:", err.message);
    return null;
  }
};


/**
 * ======================================
 * 🔐 EXISTING AUTH MIDDLEWARE (UNCHANGED)
 * ======================================
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded Token:", decoded);

    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // =========================
    // OLD STYLE (UNCHANGED)
    // =========================
    req.userId = userId;
    req.role = decoded.role;

    // =========================
    // NEW STYLE (UNCHANGED)
    // =========================
    req.user = {
      id: userId,
      role: decoded.role,
    };

    /**
     * ======================================
     * 🔥 NEW FIX: attach workspaceId async-safe
     * ======================================
     * NOTE: we don't block request, just attach promise result later
     */
    resolveWorkspaceId(userId)
      .then((workspaceId) => {
        req.user.workspaceId = workspaceId || null;
      })
      .catch((err) => {
        console.error("Workspace attach error:", err.message);
      });

    next();

  } catch (err) {
    console.error("Auth Error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authenticate;