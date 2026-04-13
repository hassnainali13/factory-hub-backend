const mongoose = require("mongoose");

const attendanceTimeConfigSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    checkInStart: String,
    checkInEnd: String,
    absentStart: String,
    absentEnd: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "AttendanceTimeConfig",
  attendanceTimeConfigSchema,
);