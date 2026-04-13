// backend/controllers/attendanceController.js
const Attendance = require("../models/Attendance");
const getDistance = require("../utils/distance");
const User = require("../models/User");
const faceapi = require("face-api.js");
const canvas = require("canvas");

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const {
  OFFICE_LAT,
  OFFICE_LNG,
  MAX_DISTANCE_METERS,
} = require("../config/location");

// ✅ Get IP
const getUserIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    ""
  );
};

// ✅ Face Distance
const calculateDistance = (desc1, desc2) => {
  return Math.sqrt(
    desc1.reduce((sum, val, i) => sum + Math.pow(val - desc2[i], 2), 0),
  );
};

// ==============================
// ✅ CHECK IN
// ==============================
exports.checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { image, latitude, longitude } = req.body;

    if (!image || !latitude || !longitude) {
      return res.status(400).json({ message: "Image + Location required" });
    }

    const user = await User.findById(userId);

    if (!user || !user.faceDescriptor?.length) {
      return res.status(400).json({ message: "Face not registered" });
    }

    // 🔥 FACE MATCH
    const img = await canvas.loadImage(image);

    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return res.status(400).json({ message: "Face not detected" });
    }

    const newDescriptor = Array.from(detection.descriptor);

    const faceDistance = calculateDistance(newDescriptor, user.faceDescriptor);

    if (faceDistance > 0.6) {
      return res.status(403).json({ message: "❌ Face not matched" });
    }

    // 🔥 LOCATION CHECK
    const distance = getDistance(latitude, longitude, OFFICE_LAT, OFFICE_LNG);

    if (distance > MAX_DISTANCE_METERS) {
      return res.status(403).json({
        message: "❌ Not in office location",
      });
    }

    // 🔥 TODAY CHECK
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const existing = await Attendance.findOne({
      user: userId,
      date: { $gte: start, $lte: end },
    });

    if (existing) {
      return res.status(400).json({
        message: "Already checked in today",
      });
    }

    // 🔥 SAVE
    const attendance = new Attendance({
      user: userId,
      image,
      latitude,
      longitude,
      date: new Date(),
      checkIn: new Date(),
      status: "Working",
    });

    await attendance.save();

    res.status(201).json({
      message: "✅ Check-in successful",
      attendance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
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
      return res.status(400).json({
        message: "Already checked out",
      });
    }

    attendance.checkOut = new Date();
    attendance.status = "Present";

    await attendance.save();

    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// 📥 GET ATTENDANCE
// ==============================
exports.getAttendances = async (req, res) => {
  try {
    const data = await Attendance.find({ user: req.user.id }).sort({
      date: -1,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// ✅ REGISTER FACE
// ==============================
exports.registerFace = async (req, res) => {
  try {
    const userId = req.user.id;
    const { descriptor } = req.body;

    if (!Array.isArray(descriptor)) {
      return res.status(400).json({ message: "Descriptor must be array" });
    }

    if (descriptor.length !== 128) {
      return res.status(400).json({
        message: "Invalid face descriptor length (must be 128)",
      });
    }

    const isValid = descriptor.every(
      (v) => typeof v === "number" && isFinite(v),
    );

    if (!isValid) {
      return res.status(400).json({
        message: "Corrupted face descriptor detected",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { faceDescriptor: descriptor },
      { new: true },
    );

    res.json({
      message: "Face registered successfully",
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
