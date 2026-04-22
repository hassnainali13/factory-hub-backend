const nodemailer = require("nodemailer");

// ==========================
// TRANSPORTER (RAILWAY SAFE)
// ==========================


const transporter = nodemailer.createTransport({
  service: "gmail", // 🔥 IMPORTANT FIX
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  family: 4,
  connectionTimeout: 20000,
  socketTimeout: 20000,
});

// ==========================
// SEND OTP EMAIL
// ==========================
const sendOTPEmail = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"FactoryHub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "FactoryHub OTP",
      text: `Your OTP is ${otp}`,
    });

    console.log("📬 Email sent:", info.response);
    return info;

  } catch (error) {
    console.error("❌ Email send failed:", error.message);
    throw error;
  }
};

module.exports = { sendOTPEmail };
