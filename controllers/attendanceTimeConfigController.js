const AttendanceTimeConfig = require("../models/AttendanceTimeConfig");
const resolveWorkspaceId = require("../utils/resolveWorkspace");

// 🔥 GET
exports.getAttendanceTimeConfig = async (req, res) => {
  try {

const workspaceId = await resolveWorkspaceId(req);
    if (!workspaceId) {
      return res.status(400).json({
        message: "workspaceId missing in token",
      });
    }

    let config = await AttendanceTimeConfig.findOne({ workspaceId });

    if (!config) {
      config = await AttendanceTimeConfig.create({
        workspaceId,
        checkInStart: "08:00",
        checkInEnd: "08:30",
        absentStart: "08:30",
        absentEnd: "08:40",
      });
    }

    res.json(config);
  } catch (err) {
    console.error("GET CONFIG ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🔥 UPDATE
exports.updateAttendanceTimeConfig = async (req, res) => {
  try {

    const workspaceId = await resolveWorkspaceId(req);

    if (!workspaceId) {
      return res.status(400).json({ message: "Workspace not found" });
    }

    const { checkInStart, checkInEnd, absentStart, absentEnd } = req.body;

    let config = await AttendanceTimeConfig.findOne({ workspaceId });

    if (!config) {
      config = new AttendanceTimeConfig({
        workspaceId,
        checkInStart,
        checkInEnd,
        absentStart,
        absentEnd,
      });
    } else {
      config.checkInStart = checkInStart;
      config.checkInEnd = checkInEnd;
      config.absentStart = absentStart;
      config.absentEnd = absentEnd;
    }

    await config.save();

    res.json({ message: "Updated", config });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};