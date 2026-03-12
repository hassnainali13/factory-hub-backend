const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    department: { type: String, required: true },

    // ⚠️ ye aap role store kar rahe ho (department_head etc)
    head: { type: String, required: true },

    // ✅ NEW: Approved head user id
    deptHeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

employeesLimit: { type: Number, required: true }, // 🔥 MAX LIMIT
  currentEmployees: { type: Number, default: 0 },   // 🔥 APPROVED COUNT
    status: {
      type: String,
      enum: ["pending", "active", "disabled"],
      default: "disabled",
    },

    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Department", departmentSchema);
