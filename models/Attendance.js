const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  image: String,
  latitude: Number,
  longitude: Number,

  date: Date,
  checkIn: Date,
  checkOut: { type: Date, default: null },
});

module.exports = mongoose.model("Attendance", attendanceSchema);