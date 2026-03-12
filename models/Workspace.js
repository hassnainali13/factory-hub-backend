//backend\models\Workspace.js

const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    logo: { type: String, default: null },

    workspaceRole: {       // Assigned on approve
      type: String,
      enum: ["general_manager", "industry_head", null],
      default: null,
    },

    status: {              // Pending / Active / Disabled
      type: String,
      enum: ["pending", "active", "disabled"],
      default: "pending",
    },

    createdBy: {           // User ID who created workspace
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workspace", workspaceSchema);
