const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
});

const sendOTPEmail = async (email, otp) => {
  try {
    console.log("📧 Sending OTP to:", email);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "FactoryHub OTP Verification",
      html: `<h2>Your OTP: ${otp}</h2>`,
    });

    console.log("✅ Email sent:", info.response);
    return info;
  } catch (err) {
    console.error("❌ Email error:", err.message);
    return null;
  }
};

module.exports = { sendOTPEmail };