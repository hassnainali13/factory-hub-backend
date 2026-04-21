// // utils/attendanceCron.js
// const cron = require("node-cron");
// const Attendance = require("../models/Attendance");
// const User = require("../models/User");
// const AttendanceTimeConfig = require("../models/AttendanceTimeConfig");

// const {
//   resolveWorkspaceIdFromUserId,
// } = require("./resolveWorkspace");

// // ===============================
// // TIME CONVERTER
// // ===============================
// const toMinutes = (time) => {
//   if (!time) return 0;
//   const [h, m] = time.split(":").map(Number);
//   return h * 60 + m;
// };

// // ===============================
// // AUTO ABSENT CRON
// // ===============================
// cron.schedule("* * * * *", async () => {
//   try {
//     const now = new Date();
//     const currentMinutes = now.getHours() * 60 + now.getMinutes();

//     console.log("⏳ Cron:", now.toLocaleTimeString());

//     const configs = await AttendanceTimeConfig.find();
//     const allUsers = await User.find();

//     const todayStart = new Date();
//     todayStart.setHours(0, 0, 0, 0);

//     const todayEnd = new Date();
//     todayEnd.setHours(23, 59, 59, 999);

//     for (const config of configs) {
//       const absentStart = toMinutes(config.absentStart);
//       const absentEnd = toMinutes(config.absentEnd);

//       console.log({
//         currentMinutes,
//         absentStart,
//         absentEnd,
//       });

//       // ✅ TIME WINDOW CHECK
//       if (!(currentMinutes >= absentStart && currentMinutes <= absentEnd)) {
//         continue;
//       }

//       console.log("🔥 ABSENT WINDOW ACTIVE");

//       const users = [];

//       // ===============================
//       // WORKSPACE MATCHING
//       // ===============================
//       for (const user of allUsers) {
//         const workspaceId = await resolveWorkspaceIdFromUserId(user._id);

//         // 🔥 DEBUG LOG (SAFE INSIDE LOOP)
//         // console.log("User:", user._id, "Workspace:", workspaceId);

//         if (!workspaceId) continue;

//         if (
//           workspaceId.toString() === config.workspaceId.toString()
//         ) {
//           users.push(user);
//         }
//       }

//       console.log("👥 Matched Users:", users.length);

//       if (!users.length) continue;

//       // ===============================
//       // BULK ABSENT INSERT
//       // ===============================
//       const bulkOps = users.map((user) => ({
//         updateOne: {
//           filter: {
//             user: user._id,
//             date: {
//               $gte: todayStart,
//               $lte: todayEnd,
//             },
//           },
//           update: {
//             $setOnInsert: {
//               user: user._id,
//               date: new Date(),
//               status: "Absent",
//             },
//           },
//           upsert: true,
//         },
//       }));

//       await Attendance.bulkWrite(bulkOps);

//       console.log(
//         `✅ Absent marked for workspace: ${config.workspaceId}`
//       );
//     }
//   } catch (err) {
//     console.error("❌ AUTO ABSENT ERROR:", err);
//   }
// });



// utils/attendanceCron.js
const cron = require("node-cron");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const AttendanceTimeConfig = require("../models/AttendanceTimeConfig");
const { resolveWorkspaceIdFromUserId } = require("./resolveWorkspace");

// ===============================
// TIMEZONE HELPER  (UTC → PKT)
// ===============================
const TIMEZONE_OFFSET_HOURS = 5; // PKT = UTC+5

/**
 * Returns a Date object shifted to Pakistan Standard Time.
 * Works correctly on both local (UTC+5) AND UTC servers.
 */
const getNowPKT = () => {
  const utcMs = Date.now(); // always UTC milliseconds
  return new Date(utcMs + TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000);
};

/**
 * Returns today's [start, end] boundaries in UTC,
 * but representing midnight→23:59 in PKT.
 *
 * e.g. PKT midnight = UTC 19:00 (previous day)
 */
const getTodayRangePKT = () => {
  const nowPKT = getNowPKT();

  // Midnight PKT in UTC
  const startPKT = new Date(nowPKT);
  startPKT.setUTCHours(0, 0, 0, 0);          // midnight in the shifted clock
  const todayStart = new Date(
    startPKT.getTime() - TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000
  );

  // 23:59:59 PKT in UTC
  const endPKT = new Date(nowPKT);
  endPKT.setUTCHours(23, 59, 59, 999);
  const todayEnd = new Date(
    endPKT.getTime() - TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000
  );

  return { todayStart, todayEnd };
};

// ===============================
// TIME CONVERTER  (HH:MM → minutes)
// ===============================
const toMinutes = (time) => {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// ===============================
// AUTO ABSENT CRON
// Runs every minute.
// Schedule is intentionally "* * * * *" so it works
// regardless of server timezone — we do the timezone
// math ourselves inside the handler.
// ===============================
cron.schedule("* * * * *", async () => {
  try {
    // ✅ Always use PKT time — works on UTC servers too
    const nowPKT = getNowPKT();
    const currentMinutes = nowPKT.getUTCHours() * 60 + nowPKT.getUTCMinutes();

    console.log(
      `⏳ Cron fired | UTC: ${new Date().toISOString()} | PKT: ${nowPKT.toISOString().replace("T", " ").slice(0, 19)}`
    );

    const configs = await AttendanceTimeConfig.find();
    const allUsers = await User.find();

    // ✅ Today's range in UTC, relative to PKT midnight
    const { todayStart, todayEnd } = getTodayRangePKT();

    for (const config of configs) {
      const absentStart = toMinutes(config.absentStart);
      const absentEnd   = toMinutes(config.absentEnd);

      console.log({ currentMinutes, absentStart, absentEnd });

      // ✅ TIME WINDOW CHECK
      if (currentMinutes < absentStart || currentMinutes > absentEnd) {
        continue;
      }

      console.log("🔥 ABSENT WINDOW ACTIVE for workspace:", config.workspaceId);

      // ===============================
      // WORKSPACE MATCHING
      // ===============================
      const users = [];

      for (const user of allUsers) {
        const workspaceId = await resolveWorkspaceIdFromUserId(user._id);
        if (!workspaceId) continue;
        if (workspaceId.toString() === config.workspaceId.toString()) {
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
            date: { $gte: todayStart, $lte: todayEnd },
          },
          update: {
            $setOnInsert: {
              user: user._id,
              date: new Date(), // stored as UTC in MongoDB — correct
              status: "Absent",
            },
          },
          upsert: true,
        },
      }));

      await Attendance.bulkWrite(bulkOps);

      console.log(`✅ Absent marked for workspace: ${config.workspaceId}`);
    }
  } catch (err) {
    console.error("❌ AUTO ABSENT ERROR:", err);
  }
});