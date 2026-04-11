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

const { OFFICE_IPS } = require("../config/ip");

// ✅ Get IP
const getUserIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    ""
  );
};

// 🔥 FACE DISTANCE
const calculateDistance = (desc1, desc2) => {
  return Math.sqrt(
    desc1.reduce((sum, val, i) => sum + Math.pow(val - desc2[i], 2), 0)
  );
};

// ==============================
// ✅ CHECK IN
// ==============================
exports.checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    let userIP = "";
    let latitude = 0;
    let longitude = 0;
    let distance = 0;

    const { image, latitude: lat, longitude: lng } = req.body;

    if (!image || !lat || !lng) {
      return res.status(400).json({
        message: "Image + Location required",
      });
    }

    latitude = parseFloat(lat);
    longitude = parseFloat(lng);

    // =====================
    // 🔐 FACE CHECK
    // =====================
    const user = await User.findById(userId);

    if (!user || !user.faceDescriptor?.length) {
      return res.status(400).json({
        message: "Face not registered",
      });
    }

    const img = await canvas.loadImage(image);

    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return res.status(400).json({ message: "Face not detected" });
    }

    const newDescriptor = Array.from(detection.descriptor);

    const faceDistance = calculateDistance(
      newDescriptor,
      user.faceDescriptor
    );

    if (faceDistance > 0.5) {
      return res.status(403).json({ message: "❌ Face not matched" });
    }

    // =====================
    // 🔐 IP + GPS CHECK
    // =====================
    userIP = getUserIP(req);
    const devIPs = ["127.0.0.1", "::1"];
    const isLocalhost = devIPs.includes(userIP);

    const isIPAllowed = OFFICE_IPS.concat(devIPs).some((ip) =>
      userIP.includes(ip)
    );

    distance = getDistance(
      latitude,
      longitude,
      OFFICE_LAT,
      OFFICE_LNG
    );

    const isLocationAllowed = distance <= MAX_DISTANCE_METERS;

    if (!isLocalhost && !isIPAllowed && !isLocationAllowed) {
      return res.status(403).json({
        message: "❌ Not in office (IP + GPS failed)",
      });
    }

    // =====================
    // 📅 TODAY RECORD
    // =====================
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const existing = await Attendance.findOne({
      user: userId,
      date: { $gte: start, $lte: end },
    });

    // 🔥 HANDLE EXISTING
    if (existing) {
      if (existing.status === "Absent") {
        // ✅ Convert Absent → Late
        existing.checkIn = new Date();
        existing.status = "Late";
        await existing.save();

        return res.status(200).json({
          message: "⚠️ Late check-in recorded",
          attendance: existing,
        });
      }

      return res.status(400).json({
        message: "Already checked in today",
      });
    }

    // =====================
    // ☁️ CLOUDINARY UPLOAD
    // =====================
    const { cloudinary } = require("../config/cloudinary");

    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: "attendance",
    });

    const imageUrl = uploadResponse.secure_url;

    // =====================
    // ✅ SAVE ATTENDANCE
    // =====================
    const attendance = new Attendance({
      user: userId,
      image: imageUrl,
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

    console.log("User IP:", userIP);
    console.log("Distance:", distance);
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

    if (attendance.status === "Absent") {
      return res.status(400).json({
        message: "Marked absent. Check-out not allowed",
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        message: "Already checked out",
      });
    }

    const hours =
      (new Date() - new Date(attendance.checkIn)) /
      (1000 * 60 * 60);

    if (hours >= 8) {
      return res.status(400).json({
        message: "Check-out expired (8h limit)",
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
    console.error(err);
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

    if (!descriptor || !Array.isArray(descriptor)) {
      return res.status(400).json({
        message: "Face descriptor required",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { faceDescriptor: descriptor },
      { new: true }
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