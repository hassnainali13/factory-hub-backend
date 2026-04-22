const nodemailer = require("nodemailer");

// ==========================
// SENDGRID TRANSPORTER
// ==========================
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey", // fixed (DO NOT CHANGE)
    pass: process.env.SENDGRID_API_KEY,
  },
  connectionTimeout: 20000,
  socketTimeout: 20000,
});

// ==========================
// SEND OTP EMAIL FUNCTION
// ==========================
const sendOTPEmail = async (email, otp) => {
  try {
    console.log("📧 Sending OTP to:", email);

    const info = await transporter.sendMail({
      from: `"FactoryHub" <${process.env.EMAIL_USER}>`, // ✅ IMPORTANT
      to: email,
      subject: "FactoryHub OTP Verification",

      html: `
        <div style="font-family:Arial; padding:20px;">
          <h2>FactoryHub Verification</h2>

          <p>Your OTP code is:</p>

          <div style="
            font-size:30px;
            font-weight:bold;
            letter-spacing:5px;
            color:#1d4ed8;
            padding:10px;
            border:2px dashed #3b82f6;
            text-align:center;
            margin:20px 0;
          ">
            ${otp}
          </div>

          <p>This code expires in 10 minutes.</p>
        </div>
      `,
    });

    // 🔥 DEBUG LOGS
    console.log("📬 FULL RESPONSE:", info);
    console.log("📬 MESSAGE ID:", info.messageId);
    console.log("📬 RESPONSE:", info.response);

    return info;
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
    return null;
  }
};

module.exports = { sendOTPEmail };