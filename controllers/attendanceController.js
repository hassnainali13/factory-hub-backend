const Attendance = require("../models/Attendance");
const fs = require("fs");
const path = require("path");
const getDistance = require("../utils/distance");
const { OFFICE_LAT, OFFICE_LNG, MAX_DISTANCE_METERS } = require("../config/location");
const { OFFICE_IPS } = require("../config/ip");

// ✅ Get IP
const getUserIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    ""
  );
};

// ==============================
// ✅ CHECK IN
// ==============================
exports.checkIn = async (req, res) => {
  let userIP = "";
  let latitude = 0;
  let longitude = 0;
  let distance = 0;

  try {
    const userId = req.user.id;
    const { image, latitude: lat, longitude: lng } = req.body;

    if (!image || !lat || !lng) {
      return res.status(400).json({ message: "All fields required" });
    }

    latitude = parseFloat(lat);
    longitude = parseFloat(lng);

    // 🔐 IP CHECK
    userIP = getUserIP(req);
    const devIPs = ["127.0.0.1", "::1"];
    const isIPAllowed = OFFICE_IPS.concat(devIPs).some((ip) => userIP.includes(ip));

    // 📍 GPS CHECK
    distance = getDistance(latitude, longitude, OFFICE_LAT, OFFICE_LNG);
    const isLocationAllowed = distance <= MAX_DISTANCE_METERS;

    // ❌ Deny if both fail
    if (!isIPAllowed && !isLocationAllowed) {
      return res.status(403).json({
        message: "❌ Not in office (IP + GPS failed)",
      });
    }

    // 📅 Check if already checked in today
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const existing = await Attendance.findOne({
      user: userId,
      date: { $gte: start, $lte: end },
    });

    if (existing) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    // 📸 Save image
    const matches = image.match(/^data:image\/(jpeg|png);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ message: "Invalid image format" });
    }
    const ext = matches[1];
    const base64Data = matches[2];

    const fileName = `attendance_${Date.now()}.${ext}`;
    const filePath = path.join(__dirname, "../uploads/", fileName);

    fs.writeFileSync(filePath, base64Data, "base64");

    const attendance = new Attendance({
      user: userId,
      image: fileName,
      latitude,
      longitude,
      date: new Date(),
      checkIn: new Date(),
    });

    await attendance.save();

    res.status(201).json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }

  // ✅ Debug logs
  console.log("User IP:", userIP);
  console.log("Latitude:", latitude, "Longitude:", longitude);
  console.log("Distance:", distance);
};

// ==============================
// ✅ CHECK OUT
// ==============================
exports.checkOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const attendance = await Attendance.findOne({
      _id: id,
      user: userId,
    });

    if (!attendance) {
      return res.status(404).json({ message: "Not found" });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: "Already checked out" });
    }

    const hours = (new Date() - new Date(attendance.checkIn)) / (1000 * 60 * 60);

    if (hours >= 8) {
      return res.status(400).json({
        message: "Check-out expired (8h limit)",
      });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// 📥 GET
// ==============================
exports.getAttendances = async (req, res) => {
  try {
    const data = await Attendance.find({ user: req.user.id }).sort({ date: -1 });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// ✅ DEBUG IP & GPS
// ==============================
exports.debugIPLocation = (req, res) => {
  try {
    const userIP =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "";
    
    // GPS example from query params (frontend se bhejo)
    const latitude = req.query.lat || 0;
    const longitude = req.query.lng || 0;

    console.log("Debug IP:", userIP);
    console.log("Debug GPS:", latitude, longitude);

    res.json({
      ip: userIP,
      latitude,
      longitude,
      message: "IP and location detected successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};