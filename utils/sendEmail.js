const nodemailer = require("nodemailer");

// ==========================
// DEBUG (VERY IMPORTANT)
// ==========================
console.log("SENDGRID_API_KEY:", process.env.SENDGRID_API_KEY ? "Loaded" : "Missing");
console.log("EMAIL_USER:", process.env.EMAIL_USER);

// ==========================
// SENDGRID TRANSPORTER
// ==========================
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
});

// 🔥 VERIFY CONNECTION
transporter.verify((err, success) => {
  if (err) {
    console.log("❌ SMTP ERROR:", err);
  } else {
    console.log("✅ SMTP READY");
  }
});

// ==========================
// SEND OTP EMAIL FUNCTION
// ==========================
const sendOTPEmail = async (email, otp) => {
  try {
    console.log("📧 Sending OTP to:", email);

    const info = await transporter.sendMail({
      from: `"FactoryHub" <${process.env.EMAIL_USER}>`, // must be verified
      to: email,
      subject: "FactoryHub OTP Verification",
      html: `
        <h2>Your OTP Code</h2>
        <h1>${otp}</h1>
        <p>Expires in 10 minutes</p>
      `,
    });

    console.log("✅ Email sent:", info.messageId);
    return info;

  } catch (err) {
    console.error("❌ Email send failed:", err);
    return null;
  }
};

module.exports = { sendOTPEmail };