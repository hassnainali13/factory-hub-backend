const cron = require("node-cron");
const Attendance = require("../models/Attendance");
const User = require("../models/User");

cron.schedule("40 13 * * *", async () => {
  console.log("⏳ Marking absentees...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const users = await User.find();

  for (let user of users) {
    const existing = await Attendance.findOne({
      user: user._id,
      date: { $gte: today, $lte: end },
    });

    if (!existing) {
      await Attendance.create({
        user: user._id,
        date: new Date(),
        status: "Absent",
      });
    }
  }
});
