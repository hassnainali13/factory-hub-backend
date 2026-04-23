// backend/server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// =============================
// ✅ ROUTES IMPORT
// =============================
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
// ✅ FACE API SETUP
// =============================
const faceapi = require("face-api.js");
const canvas = require("canvas");

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// 🔥 LOAD MODELS FUNCTION
const path = require("path");

async function loadModels() {
  try {
    const modelPath = path.join(__dirname, "models/FaceApiModels");

    await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);

    console.log("✅ Face API models loaded");
  } catch (err) {
    console.error("❌ Face model load error:", err);
    throw err; // ❗ important so server doesn't start
  }
}

// =============================
// ✅ MIDDLEWARE
// =============================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // ✅ add PATCH
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "10mb" }));

app.use("/uploads", express.static("uploads"));
app.use("/ProfileImage", express.static("ProfileImage"));

// =============================
// ✅ AUTH MIDDLEWARE
// =============================
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
// ✅ CRON JOB
// =============================
require("./utils/attendanceCron");

// =============================
// ✅ START SERVER (FINAL FIX)
// =============================
const startServer = async () => {
  try {
    // 🔥 1. Load Face Models FIRST
    await loadModels();

    // 🔥 2. Connect MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    // 🔥 3. Start Server
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("❌ Server start error:", error);
  }
};

startServer();
