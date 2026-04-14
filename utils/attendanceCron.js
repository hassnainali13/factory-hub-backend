// utils/attendanceCron.js
const cron = require("node-cron");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const AttendanceTimeConfig = require("../models/AttendanceTimeConfig");

const {
  resolveWorkspaceIdFromUserId,
} = require("./resolveWorkspace");

// ===============================
// TIME CONVERTER
// ===============================
const toMinutes = (time) => {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// ===============================
// AUTO ABSENT CRON
// ===============================
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    console.log("⏳ Cron:", now.toLocaleTimeString());

    const configs = await AttendanceTimeConfig.find();
    const allUsers = await User.find();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    for (const config of configs) {
      const absentStart = toMinutes(config.absentStart);
      const absentEnd = toMinutes(config.absentEnd);

      console.log({
        currentMinutes,
        absentStart,
        absentEnd,
      });

      // ✅ TIME WINDOW CHECK
      if (!(currentMinutes >= absentStart && currentMinutes <= absentEnd)) {
        continue;
      }

      console.log("🔥 ABSENT WINDOW ACTIVE");

      const users = [];

      // ===============================
      // WORKSPACE MATCHING
      // ===============================
      for (const user of allUsers) {
        const workspaceId = await resolveWorkspaceIdFromUserId(user._id);

        // 🔥 DEBUG LOG (SAFE INSIDE LOOP)
        // console.log("User:", user._id, "Workspace:", workspaceId);

        if (!workspaceId) continue;

        if (
          workspaceId.toString() === config.workspaceId.toString()
        ) {
          users.push(user);
        }
      }

      console.log("👥 Matched Users:", users.length);

      if (!users.length) continue;

      // ===============================
      // BULK ABSENT INSERT
      // ===============================
      const bulkOps = users.map((user) => ({
        updateOne: {
          filter: {
            user: user._id,
            date: {
              $gte: todayStart,
              $lte: todayEnd,
            },
          },
          update: {
            $setOnInsert: {
              user: user._id,
              date: new Date(),
              status: "Absent",
            },
          },
          upsert: true,
        },
      }));

      await Attendance.bulkWrite(bulkOps);

      console.log(
        `✅ Absent marked for workspace: ${config.workspaceId}`
      );
    }
  } catch (err) {
    console.error("❌ AUTO ABSENT ERROR:", err);
  }
});