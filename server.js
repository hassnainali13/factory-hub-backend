
// backend/server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const authRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const joinRoutes = require("./routes/joinRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const userRoutes = require("./routes/userRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const attendanceTimeConfigRoutes = require("./routes/attendanceTimeConfigRoutes");

const User = require("./models/User");

const app = express();

// =============================
// ✅ FACE API MODEL LOAD (FIXED)
// =============================
const faceapi = require("face-api.js");
const canvas = require("canvas");

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

async function loadModels() {
  try {
    await faceapi.nets.tinyFaceDetector.loadFromDisk("./models");
    await faceapi.nets.faceLandmark68Net.loadFromDisk("./models");
    await faceapi.nets.faceRecognitionNet.loadFromDisk("./models");
    console.log("✅ Face API models loaded");
  } catch (err) {
    console.error("❌ Face model load error:", err);
  }
}

loadModels();

// =============================
// ✅ MIDDLEWARE
// =============================
app.use(cors());
app.use(express.json({ limit: "10mb" })); // 🔥 IMPORTANT for base64 image

app.use("/uploads", express.static("uploads"));
app.use("/ProfileImage", express.static("ProfileImage"));

// =============================
// ✅ DB CONNECTION
// =============================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((error) => console.error("❌ DB Error:", error));

// =============================
// ✅ AUTH MIDDLEWARE (FIXED)
// =============================
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 IMPORTANT FIX
    req.user = { id: decoded.userId };

    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// =============================
// ✅ ROUTES
// =============================
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/join", joinRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/attendance-time-config", attendanceTimeConfigRoutes);
// =============================
// ✅ AUTH USER ROUTE
// =============================
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "workspaceId",
      select: "name logo status code role",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// =============================
// ✅ CRON JOB LOAD (FIXED)
// =============================
require("./utils/attendanceCron"); // 🔥 correct path

// =============================
// ✅ START SERVER
// =============================
app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
