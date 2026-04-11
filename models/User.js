const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: [
        "user",
        "general_manager",
        "department_head",
        "staff",
        "industry_head",
      ],
      default: "user",
    },

    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    requestStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: null,
    },

    staffstatus: {
      type: String,
      enum: ["pending", "approved", "disabled"],
      default: null,
    },

    profileImage: {
      type: String,
      default: null,
    },

    // 🔥 FACE RECOGNITION FIELD
    faceDescriptor: {
      type: [Number],
      default: [],
    },

    resetToken: {
      type: String,
      default: null,
    },

    resetTokenExpiry: {
      type: Date,
      default: null,
    },

    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);