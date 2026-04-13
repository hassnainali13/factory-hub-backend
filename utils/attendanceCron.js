const cron = require("node-cron");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const AttendanceTimeConfig = require("../models/AttendanceTimeConfig");

// ===============================
// TIME CONVERTER
// ===============================
const toMinutes = (time) => {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// ===============================
// AUTO ABSENT CRON (EVERY MINUTE)
// ===============================
cron.schedule("* * * * *", async () => {
  try {
    console.log("⏳ Auto Absent Cron Running...");

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // get all workspace configs
    const configs = await AttendanceTimeConfig.find();

    for (const config of configs) {
      const absentStart = toMinutes(config.absentStart);
      const absentEnd = toMinutes(config.absentEnd);

      // ⛔ outside absent window
      if (currentMinutes < absentStart || currentMinutes > absentEnd) {
        continue;
      }

      // workspace users
      const users = await User.find({
        workspaceId: config.workspaceId,
      });

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      for (const user of users) {
        // check today's attendance
        const existing = await Attendance.findOne({
          user: user._id,
          date: { $gte: todayStart, $lte: todayEnd },
        });

        // ❌ already exists → skip
        if (existing) continue;

        await Attendance.updateOne(
          {
            user: user._id,
            date: { $gte: todayStart, $lte: todayEnd },
          },
          {
            $setOnInsert: {
              user: user._id,
              date: new Date(),
              status: "Absent",
            },
          },
          { upsert: true },
        );

        console.log(`❌ Absent marked for user: ${user._id}`);
      }
    }
  } catch (err) {
    console.error("❌ AUTO ABSENT ERROR:", err);
  }
});
