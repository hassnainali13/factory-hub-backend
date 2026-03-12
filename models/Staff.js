const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },

  status: {
    type: String,
    enum: ["pending", "active"],
    default: "pending",
  },

  joinedAt: Date,
});

module.exports = mongoose.model("Staff", staffSchema);