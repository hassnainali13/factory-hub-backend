const nodemailer = require("nodemailer");

// ==========================
// TRANSPORTER (RAILWAY FIXED)
// ==========================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  tls: {
    rejectUnauthorized: false,
  },

  family: 4, // 🔥 FORCE IPv4 (IMPORTANT FOR RAILWAY)
});

// ==========================
// SEND OTP EMAIL
// ==========================
const sendOTPEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"FactoryHub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "FactoryHub – Your Verification Code",

      html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 480px;
        margin: auto;
        background: #f9fafb;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
      ">

        <div style="
          background: #1d4ed8;
          padding: 25px;
          text-align: center;
          color: white;
          font-size: 22px;
          font-weight: bold;
        ">
          ⚙️ FactoryHub
        </div>

        <div style="padding: 30px;">
          <h2 style="color:#111827;">Verify Your Email</h2>

          <p style="color:#6b7280;">
            Use this OTP to complete registration. It is valid for 10 minutes.
          </p>

          <div style="
            margin: 25px 0;
            padding: 20px;
            text-align: center;
            border: 2px dashed #3b82f6;
            background: #eff6ff;
            border-radius: 10px;
          ">
            <h1 style="
              font-size: 36px;
              letter-spacing: 6px;
              color: #1d4ed8;
              margin: 0;
            ">${otp}</h1>
          </div>

          <p style="color:#9ca3af; font-size: 13px;">
            If you did not request this, ignore this email.
          </p>
        </div>

        <div style="
          background:#f3f4f6;
          text-align:center;
          padding: 15px;
          font-size: 12px;
          color:#9ca3af;
        ">
          © ${new Date().getFullYear()} FactoryHub
        </div>

      </div>
      `,
    });

  } catch (error) {
    console.error("❌ Email send failed:", error.message);

    // 🔥 IMPORTANT: DON'T CRASH SERVER
    // just log error
  }
};

module.exports = { sendOTPEmail };