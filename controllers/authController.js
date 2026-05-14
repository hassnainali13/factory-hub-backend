// // // backend/controllers/authController.js

// // const bcrypt = require("bcryptjs");
// // const jwt = require("jsonwebtoken");
// // const User = require("../models/User");
// // const TempUser = require("../models/TempUser");
// // const { sendOTPEmail } = require("../utils/sendEmail");

// // const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;
// // const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;

// // // JWT
// // const createToken = (payload) => {
// //   return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
// // };

// // // ==========================
// // // REGISTER
// // // ==========================
// // exports.register = async (req, res) => {
// //   try {
// //     const { name, email, password, role } = req.body;

// //     // check real user
// //     const exist = await User.findOne({ email });
// //     if (exist) {
// //       return res.status(400).json({ message: "User already exists" });
// //     }

// //     // hash
// //     const hash = await bcrypt.hash(password, 10);

// //     // OTP
// //     const otp = Math.floor(100000 + Math.random() * 900000).toString();

// //     // delete old temp
// //     await TempUser.deleteOne({ email });

// //     // save temp user
// //     await TempUser.create({
// //       name,
// //       email,
// //       password: hash,
// //       role: role || "user",
// //       otp,
// //       otpExpiry: Date.now() + 10 * 60 * 1000,
// //     });

// // try {
// //   await sendOTPEmail(email, otp);
// // } catch (err) {
// //   console.log("Email failed but continue");
// // }
// //     res.json({ message: "OTP sent to email" });
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ message: "Server error" });
// //   }
// // };

// // // ==========================
// // // VERIFY OTP
// // // ==========================
// // exports.verifyOTP = async (req, res) => {
// //   try {
// //     const { email, otp } = req.body;

// //     const tempUser = await TempUser.findOne({ email });

// //     if (!tempUser) {
// //       return res.status(404).json({ message: "Signup again" });
// //     }

// //     if (tempUser.otp !== otp) {
// //       return res.status(400).json({ message: "Invalid OTP" });
// //     }

// //     if (tempUser.otpExpiry < Date.now()) {
// //       return res.status(400).json({ message: "OTP expired" });
// //     }

// //     // create real user
// //     const user = await User.create({
// //       name: tempUser.name,
// //       email: tempUser.email,
// //       password: tempUser.password,
// //       role: tempUser.role,
// //       isApproved: true,
// //     });

// //     await TempUser.deleteOne({ email });

// //     res.json({ message: "Account created", userId: user._id });
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ message: "Server error" });
// //   }
// // };

// // // ==========================
// // // RESEND OTP
// // // ==========================
// // exports.resendOTP = async (req, res) => {
// //   try {
// //     const { email } = req.body;

// //     const tempUser = await TempUser.findOne({ email });

// //     if (!tempUser) {
// //       return res.status(404).json({ message: "No pending signup" });
// //     }

// //     const otp = Math.floor(100000 + Math.random() * 900000).toString();

// //     tempUser.otp = otp;
// //     tempUser.otpExpiry = Date.now() + 10 * 60 * 1000;

// //     await tempUser.save();
// //     try {
// //       await sendOTPEmail(email, otp);
// //     } catch (err) {
// //       console.error("OTP email failed:", err.message);
// //     }

// //     res.json({ message: "OTP resent" });
// //   } catch (err) {
// //     res.status(500).json({ message: "Server error" });
// //   }
// // };

// // // ==========================
// // // LOGIN
// // // ==========================
// // exports.login = async (req, res) => {
// //   try {
// //     const { email, password } = req.body;

// //     // superadmin
// //     if (email === SUPERADMIN_EMAIL) {
// //       if (password === SUPERADMIN_PASSWORD) {
// //         const token = createToken({
// //           userId: "superadmin",
// //           role: "superadmin",
// //         });

// //         return res.json({
// //           token,
// //           user: {
// //             email,
// //             role: "superadmin",
// //           },
// //         });
// //       }
// //     }

// //     const user = await User.findOne({ email });

// //     // 🔥 check temp user
// //     const tempUser = await TempUser.findOne({ email });

// //     if (!user && tempUser) {
// //       return res.status(403).json({
// //         message: "Please verify your email first",
// //         verifyRequired: true,
// //         email,
// //       });
// //     }

// //     if (!user) {
// //       return res.status(404).json({ message: "User not found" });
// //     }

// //     const match = await bcrypt.compare(password, user.password);

// //     if (!match) {
// //       return res.status(401).json({ message: "Invalid credentials" });
// //     }

// //     const token = createToken({
// //       userId: user._id,
// //       role: user.role,
// //     });

// //     res.json({ message: "Login success", token, user });
// //   } catch (err) {
// //     res.status(500).json({ message: "Server error" });
// //   }
// // };

// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");
// const TempUser = require("../models/TempUser");
// const { sendOTPEmail } = require("../utils/sendEmail");

// const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;
// const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;

// // JWT
// const createToken = (payload) => {
//   return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
// };

// // ==========================
// // REGISTER
// // ==========================
// exports.register = async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

//     const exist = await User.findOne({ email });
//     if (exist) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     const hash = await bcrypt.hash(password, 10);

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     await TempUser.deleteOne({ email });

//     await TempUser.create({
//       name,
//       email,
//       password: hash,
//       role: role || "user",
//       otp,
//       otpExpiry: Date.now() + 10 * 60 * 1000,
//     });

//     // 🔥 FIX: email background me send hogi (wait nahi karega)
//     sendOTPEmail(email, otp)
//       .then(() => console.log("✅ OTP email function executed"))
//       .catch((err) => console.log("❌ Email failed:", err.message));

//     // 🔥 FIX: instant response (frontend freeze solve)
//     res.json({
//       message: "OTP sent to email",
//       email,
//     });

//   } catch (err) {
//     console.error("Register error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ==========================
// // VERIFY OTP
// // ==========================
// exports.verifyOTP = async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     const tempUser = await TempUser.findOne({ email });

//     if (!tempUser) {
//       return res.status(404).json({ message: "Signup again" });
//     }

//     if (tempUser.otp !== otp) {
//       return res.status(400).json({ message: "Invalid OTP" });
//     }

//     if (tempUser.otpExpiry < Date.now()) {
//       return res.status(400).json({ message: "OTP expired" });
//     }

//     const user = await User.create({
//       name: tempUser.name,
//       email: tempUser.email,
//       password: tempUser.password,
//       role: tempUser.role,
//       isApproved: true,
//     });

//     await TempUser.deleteOne({ email });

//     res.json({ message: "Account created", userId: user._id });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ==========================
// // RESEND OTP
// // ==========================
// exports.resendOTP = async (req, res) => {
//   try {
//     const { email } = req.body;

//     const tempUser = await TempUser.findOne({ email });

//     if (!tempUser) {
//       return res.status(404).json({ message: "No pending signup" });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     tempUser.otp = otp;
//     tempUser.otpExpiry = Date.now() + 10 * 60 * 1000;

//     await tempUser.save();

//     // 🔥 FIX: async email
//     sendOTPEmail(email, otp)
//       .then(() => console.log("✅ Resend OTP email executed"))
//       .catch((err) => console.log("❌ Resend email failed:", err.message));

//     res.json({ message: "OTP resent" });

//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ==========================
// // LOGIN (UNCHANGED)
// // ==========================
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (email === SUPERADMIN_EMAIL) {
//       if (password === SUPERADMIN_PASSWORD) {
//         const token = createToken({
//           userId: "superadmin",
//           role: "superadmin",
//         });

//         return res.json({
//           token,
//           user: {
//             email,
//             role: "superadmin",
//           },
//         });
//       }
//     }

//     const user = await User.findOne({ email });
//     const tempUser = await TempUser.findOne({ email });

//     if (!user && tempUser) {
//       return res.status(403).json({
//         message: "Please verify your email first",
//         verifyRequired: true,
//         email,
//       });
//     }

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const match = await bcrypt.compare(password, user.password);

//     if (!match) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const token = createToken({
//       userId: user._id,
//       role: user.role,
//     });

//     res.json({ message: "Login success", token, user });

//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const TempUser = require("../models/TempUser");
const Workspace = require("../models/Workspace");
const { resolveWorkspaceId } = require("../utils/resolveWorkspace");
const { sendOTPEmail } = require("../utils/sendEmail");

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;

const createToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ==========================
// REGISTER
// ==========================
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

    console.log("[REGISTER] request body:", req.body);

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Missing required fields: name, email, password",
      });
    }

    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await TempUser.deleteOne({ email });

    await TempUser.create({
      name,
      email,
      password: hash,
      role: role || "user",
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000,
    });

    sendOTPEmail(email, otp)
      .then(() => console.log("✅ OTP email sent"))
      .catch((err) => console.log("❌ Email failed:", err.message));

    res.json({ message: "OTP sent to email", email });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// VERIFY OTP
// ==========================
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const tempUser = await TempUser.findOne({ email });

    if (!tempUser) return res.status(404).json({ message: "Signup again" });
    if (tempUser.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
    if (tempUser.otpExpiry < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    const user = await User.create({
      name: tempUser.name,
      email: tempUser.email,
      password: tempUser.password,
      role: tempUser.role,
      isApproved: true,
    });

    await TempUser.deleteOne({ email });

    res.json({ message: "Account created", userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// RESEND OTP
// ==========================
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const tempUser = await TempUser.findOne({ email });
    if (!tempUser)
      return res.status(404).json({ message: "No pending signup" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    tempUser.otp = otp;
    tempUser.otpExpiry = Date.now() + 10 * 60 * 1000;
    await tempUser.save();

    sendOTPEmail(email, otp)
      .then(() => console.log("✅ Resend OTP sent"))
      .catch((err) => console.log("❌ Resend email failed:", err.message));

    res.json({ message: "OTP resent" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// VERIFY RESET PASSWORD OTP
// ==========================
exports.verifyResetPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    res.json({ message: "OTP verified" });
  } catch (err) {
    console.error("Verify reset password OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// RESEND RESET PASSWORD OTP
// ==========================
exports.resendResetOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    sendOTPEmail(email, otp)
      .then(() => console.log("✅ Resend reset OTP sent"))
      .catch((err) =>
        console.log("❌ Resend reset email failed:", err.message),
      );

    res.json({ message: "OTP resent" });
  } catch (err) {
    console.error("Resend reset password OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// LOGIN
// ==========================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Superadmin check
    if (email === SUPERADMIN_EMAIL) {
      if (password === SUPERADMIN_PASSWORD) {
        const token = createToken({ userId: "superadmin", role: "superadmin" });
        return res.json({
          token,
          user: { email, role: "superadmin" },
        });
      } else {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    }

    // ✅ populate("departmentId") added
    const user = await User.findOne({ email })
      .populate("departmentId")
      .populate({
        path: "staffId",
        populate: {
          path: "departmentId", // nested populate
          // grab what you need
        },
      });
    const tempUser = await TempUser.findOne({ email });

    if (!user && tempUser) {
      return res.status(403).json({
        message: "Please verify your email first",
        verifyRequired: true,
        email,
      });
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = createToken({ userId: user._id, role: user.role });

    const resolvedWorkspaceId =
      user.workspaceId ||
      (await resolveWorkspaceId({ userId: user._id })) ||
      null;

    let workspaceStatus = null;
    if (resolvedWorkspaceId) {
      const workspace =
        await Workspace.findById(resolvedWorkspaceId).select("status");
      workspaceStatus = workspace?.status || null;
    }

    const userObj = user.toObject();

    res.json({
      message: "Login success",
      token,
      user: {
        ...userObj,
        workspaceStatus,
        workspaceId:
          resolvedWorkspaceId ||
          userObj.workspaceId?._id ||
          userObj.workspaceId,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    sendOTPEmail(email, otp)
      .then(() => console.log("✅ Forgot password OTP sent"))
      .catch((err) =>
        console.log("❌ Forgot password email failed:", err.message),
      );

    res.json({ message: "OTP sent to email for password reset" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// RESET PASSWORD
// ==========================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    user.otp = null; // clear OTP
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
