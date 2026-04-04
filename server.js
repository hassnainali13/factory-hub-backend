//backend\server.js

require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken"); // Import JWT for token verification

const authRoutes = require("./routes/authRoutes"); // Importing routes
const workspaceRoutes = require("./routes/workspaceRoutes"); // Import workspace routes
const User = require("./models/User"); // Import User model
const superAdminRoutes = require("./routes/superAdminRoutes"); // ✅ import
const joinRoutes = require("./routes/joinRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const userRoutes = require("./routes/userRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

// Routes
const app = express();
// Middleware setup
app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // Parse incoming JSON requests
app.use("/uploads", express.static("uploads"));
// Serve uploads folder
app.use("/ProfileImage", express.static("ProfileImage"));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to the database"))
  .catch((error) => console.error("Database connection error:", error));

// Define the token authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Get the token from Authorization header

  if (!token) {
    return res.status(403).json({ message: "Access denied" });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    // If token is valid, set the userId in request object
    req.userId = decoded.userId;
    next(); // Proceed to the next middleware or route handler
  });
};

// Register Routes
app.use("/api/auth", authRoutes); // Register auth routes
app.use("/api/workspaces", workspaceRoutes); // Register workspace routes
app.use("/api/superadmin", superAdminRoutes); // ✅ mount
app.use("/api/join", joinRoutes); // ✅ mount join routes
app.use("/api/departments", departmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", joinRoutes);
app.use("/api/attendance", attendanceRoutes);


// Protected route to get the authenticated user's data
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
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

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
