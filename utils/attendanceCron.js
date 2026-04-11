const cron = require("node-cron");
const Attendance = require("../models/Attendance");
const User = require("../models/User");

// 🕐 Run ONLY at 1:40 PM
cron.schedule("40 13 * * *", async () => {
  try {
    console.log("⏳ Marking absentees (1:40 PM)...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cutoffTime = new Date();
    cutoffTime.setHours(13, 30, 0, 0); // 1:30 PM

    const users = await User.find();

    for (let user of users) {
      // 🔥 Skip users who joined after 1:30 PM
      if (new Date(user.createdAt) > cutoffTime) continue;

      const existing = await Attendance.findOne({
        user: user._id,
        date: { $gte: today },
      });

      // ❌ No record → mark absent
      if (!existing) {
        await Attendance.create({
          user: user._id,
          date: new Date(),
          status: "Absent",
        });

        console.log("❌ Absent:", user._id);
      }
    }
  } catch (err) {
    console.error("Cron error:", err);
  }
});