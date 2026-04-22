const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"FactoryHub" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "FactoryHub – Your Verification Code",
    html: `
      <div style="
        font-family: 'Segoe UI', Arial, sans-serif;
        max-width: 480px;
        margin: 0 auto;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
      ">

        <!-- Header -->
        <div style="
          background: #1d4ed8;
          padding: 28px 32px;
          text-align: center;
        ">
          <h1 style="
            margin: 0;
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
          ">⚙️ FactoryHub</h1>
          <p style="
            margin: 6px 0 0;
            color: #bfdbfe;
            font-size: 13px;
          ">Factory Management Platform</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
          <h2 style="
            margin: 0 0 8px;
            color: #111827;
            font-size: 18px;
          ">Verify Your Email Address</h2>
          <p style="
            margin: 0 0 24px;
            color: #6b7280;
            font-size: 14px;
            line-height: 1.6;
          ">
            Use the OTP code below to complete your registration.
            This code is valid for <strong>10 minutes</strong>.
          </p>

          <!-- OTP Box -->
          <div style="
            background: #eff6ff;
            border: 2px dashed #3b82f6;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            margin-bottom: 24px;
          ">
            <p style="
              margin: 0 0 6px;
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 1px;
            ">Your OTP Code</p>
            <h1 style="
              margin: 0;
              font-size: 40px;
              font-weight: 800;
              color: #1d4ed8;
              letter-spacing: 8px;
            ">${otp}</h1>
          </div>

          <p style="
            margin: 0;
            font-size: 13px;
            color: #9ca3af;
            line-height: 1.6;
          ">
            If you did not request this code, please ignore this email.
            Your account will remain secure.
          </p>
        </div>

        <!-- Footer -->
        <div style="
          background: #f3f4f6;
          border-top: 1px solid #e5e7eb;
          padding: 16px 32px;
          text-align: center;
        ">
          <p style="
            margin: 0;
            font-size: 12px;
            color: #9ca3af;
          ">© ${new Date().getFullYear()} FactoryHub. All rights reserved.</p>
        </div>

      </div>
    `,
  });
};

module.exports = { sendOTPEmail };