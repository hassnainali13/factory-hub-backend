const sgMail = require("@sendgrid/mail");

// ✅ API KEY SET
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ==========================
// SEND OTP EMAIL
// ==========================
const sendOTPEmail = async (email, otp) => {
  try {
    console.log("📧 Sending OTP to:", email);

    const msg = {
      to: email,
      from: process.env.EMAIL_USER, // verified sender
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
    };

    const response = await sgMail.send(msg);

    console.log("✅ Email sent:", response[0].statusCode);
    return response;

  } catch (err) {
    console.error("❌ Email send failed:", err.response?.body || err.message);
    return null;
  }
};

module.exports = { sendOTPEmail };