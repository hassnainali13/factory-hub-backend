// backend/controllers/attendanceController.js
const Attendance = require("../models/Attendance");
const getDistance = require("../utils/distance");
const User = require("../models/User");
const Staff = require("../models/Staff");
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
// ✅ SUBMIT ATTENDANCE REPORT
// ==============================
exports.submitReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { report } = req.body;

    if (!report || !report.trim()) {
      return res.status(400).json({ message: "Report text is required" });
    }

    const attendance = await Attendance.findOne({ _id: id, user: userId });

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    if (attendance.status !== "Absent") {
      return res
        .status(400)
        .json({ message: "Only absent attendance can be reported" });
    }

    if (attendance.reportStatus === "approved") {
      return res
        .status(400)
        .json({ message: "This report has already been approved" });
    }

    if (attendance.reportStatus === "rejected") {
      return res
        .status(400)
        .json({ message: "Rejected reports cannot be resubmitted" });
    }

    attendance.report = report.trim();
    attendance.reportStatus = "pending";

    await attendance.save();

    res.json({ attendance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// ✅ PENDING ATTENDANCE REPORTS
// ==============================
exports.getPendingReports = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id)
      .populate("departmentId")
      .populate("staffId");

    if (!currentUser) {
      return res.status(403).json({ message: "Access denied" });
    }

    let department = currentUser.departmentId || null;

    if (!department && currentUser.staffId) {
      const staffDoc = await Staff.findById(currentUser.staffId).populate(
        "departmentId",
      );
      department = staffDoc?.departmentId || null;
    }

    if (!department) {
      return res.status(403).json({ message: "Access denied" });
    }

    const isHRDepartment = String(department.department)
      .toLowerCase()
      .includes("hr");

    if (!isHRDepartment) {
      return res.status(403).json({ message: "Access denied" });
    }

    const reports = await Attendance.find({
      report: { $exists: true, $ne: "" },
      reportStatus: "pending",
    })
      .sort({ date: -1 })
      .populate("user", "name email");

    const hrStaffDocs = await Staff.find({ departmentId: department._id });
    const hrStaffUserIds = hrStaffDocs.map((doc) => doc.userId);

    const hrStaffUsers = await User.find({
      _id: { $in: hrStaffUserIds },
      role: "staff",
    }).sort({ _id: 1 });

    const staffIds = hrStaffUsers.map((u) => String(u._id));

    const assignedReports = reports.map((report, index) => {
      const assignedIndex = staffIds.length ? index % staffIds.length : null;
      const assignedUser =
        assignedIndex !== null ? hrStaffUsers[assignedIndex] : null;
      return {
        ...report.toObject(),
        assignedTo: assignedUser ? assignedUser._id : null,
        assignedToName: assignedUser
          ? assignedUser.name || assignedUser.email
          : null,
      };
    });

    if (currentUser.role === "department_head") {
      return res.json({ reports: assignedReports });
    }

    const filtered = assignedReports.filter(
      (report) => String(report.assignedTo) === String(currentUser._id),
    );

    res.json({ reports: filtered });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const resolveUserDepartment = async (currentUser) => {
  if (currentUser.departmentId) return currentUser.departmentId;
  if (currentUser.staffId) {
    const staffDoc = await Staff.findById(currentUser.staffId).populate(
      "departmentId",
    );
    return staffDoc?.departmentId || null;
  }
  return null;
};

const isHRDepartment = (department) =>
  Boolean(
    department && String(department.department).toLowerCase().includes("hr"),
  );

const getHrStaffUsersByDepartment = async (departmentId) => {
  const hrStaffDocs = await Staff.find({ departmentId });
  const hrStaffUserIds = hrStaffDocs.map((doc) => doc.userId);
  return User.find({
    _id: { $in: hrStaffUserIds },
    role: "staff",
  }).sort({ _id: 1 });
};

const getAssignedReportInfo = (reports, hrStaffUsers) => {
  return reports.map((report, index) => {
    const assignedIndex = hrStaffUsers.length
      ? index % hrStaffUsers.length
      : null;
    const assignedUser =
      assignedIndex !== null ? hrStaffUsers[assignedIndex] : null;
    return {
      reportId: String(report._id),
      assignedTo: assignedUser ? String(assignedUser._id) : null,
    };
  });
};

const authorizeStaffForReport = async (currentUser, reportId) => {
  const department = await resolveUserDepartment(currentUser);
  if (!department || !isHRDepartment(department)) {
    return false;
  }

  const hrStaffUsers = await getHrStaffUsersByDepartment(department._id);
  if (!hrStaffUsers.length) {
    return false;
  }

  const reports = await Attendance.find({
    report: { $exists: true, $ne: "" },
    reportStatus: "pending",
  })
    .sort({ date: -1 })
    .select("_id");

  const assignedReports = getAssignedReportInfo(reports, hrStaffUsers);
  const reportInfo = assignedReports.find(
    (item) => item.reportId === String(reportId),
  );

  return reportInfo?.assignedTo === String(currentUser._id);
};

// ==============================
// ✅ APPROVE ATTENDANCE REPORT
// ==============================
exports.approveReport = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    if (!attendance.report || attendance.reportStatus !== "pending") {
      return res
        .status(400)
        .json({ message: "No pending report available for approval" });
    }

    if (attendance.status !== "Absent") {
      return res
        .status(400)
        .json({ message: "Only absent attendance reports can be approved" });
    }

    const currentUser = await User.findById(req.user.id)
      .populate("departmentId")
      .populate("staffId");

    if (!currentUser) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (currentUser.role === "staff") {
      const authorized = await authorizeStaffForReport(currentUser, id);
      if (!authorized) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    attendance.status = "Present";
    attendance.reportStatus = "approved";

    await attendance.save();

    res.json({ attendance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.rejectReport = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    if (!attendance.report || attendance.reportStatus !== "pending") {
      return res
        .status(400)
        .json({ message: "No pending report available for rejection" });
    }

    if (attendance.status !== "Absent") {
      return res
        .status(400)
        .json({ message: "Only absent attendance reports can be rejected" });
    }

    const currentUser = await User.findById(req.user.id)
      .populate("departmentId")
      .populate("staffId");

    if (!currentUser) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (currentUser.role === "staff") {
      const authorized = await authorizeStaffForReport(currentUser, id);
      if (!authorized) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    attendance.reportStatus = "rejected";

    await attendance.save();

    res.json({ attendance });
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
