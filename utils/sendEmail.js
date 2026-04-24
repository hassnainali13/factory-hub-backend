const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOTPEmail = async (email, otp) => {
  try {
    console.log("📧 Sending OTP to:", email);

    const rawOtp = String(otp);
    const formatted =
      rawOtp.slice(0, 3).split("").join(" ") +
      " &mdash; " +
      rawOtp.slice(3).split("").join(" ");

    const msg = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: "FactoryHub // Access Verification",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            /* ===== MOBILE RESPONSIVE ===== */
            @media only screen and (max-width: 600px) {

              /* Full width card on mobile */
              .email-card {
                width: 100% !important;
                border-radius: 0 !important;
              }

              /* Remove outer padding so email fills screen edge-to-edge */
              .email-outer {
                padding: 0 !important;
              }

              /* Tighter header on mobile */
              .email-header {
                padding: 14px 16px !important;
              }

              /* Tighter body padding on mobile */
              .email-body {
                padding: 20px 16px !important;
              }

              /* Smaller OTP code on mobile so it fits */
              .otp-code {
                font-size: 22px !important;
                letter-spacing: 4px !important;
                word-break: break-all;
              }

              /* Stack OTP label and timer vertically on mobile */
              .otp-meta-label {
                display: block !important;
                margin-bottom: 4px !important;
              }

              .otp-meta-timer {
                display: block !important;
                text-align: left !important;
              }

              /* Stack footer items on mobile */
              .footer-left {
                display: block !important;
                margin-bottom: 8px !important;
              }

              .footer-right {
                display: block !important;
                text-align: left !important;
              }

              /* Reduce title size on mobile */
              .main-title {
                font-size: 18px !important;
              }
            }
          </style>
        </head>
        <body style="margin:0; padding:0; background:#dbeafe;">

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#dbeafe;">
            <tr>
              <td align="center" class="email-outer" style="padding:30px 10px;">

                <table
                  class="email-card"
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="
                    max-width:540px;
                    background:#ffffff;
                    border:1px solid #dbeafe;
                    border-radius:8px;
                    overflow:hidden;
                    font-family:'Barlow',Arial,sans-serif;
                  "
                >

                  <!-- ===== HEADER ===== -->
                  <tr>
                    <td class="email-header" style="background:#1d4ed8; padding:22px 28px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>

                          <!-- Logo icon -->
                          <td style="vertical-align:middle; padding-right:12px; width:40px;">
                            <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 23a5 5 0 100-10 5 5 0 000 10z" stroke="#93c5fd" stroke-width="1.5"/>
                              <path d="M15 3h6l1 3.5a9.5 9.5 0 012.5 1.4L28 6.5l3 5.2-2.7 2.3a9.7 9.7 0 010 3L31 19.3l-3 5.2-3.5-1.4a9.5 9.5 0 01-2.5 1.4L21 28h-6l-1-3.5a9.5 9.5 0 01-2.5-1.4L8 24.5l-3-5.2 2.7-2.3a9.7 9.7 0 010-3L5 11.7l3-5.2 3.5 1.4A9.5 9.5 0 0114 6.5L15 3z" stroke="#93c5fd" stroke-width="1.5" stroke-linejoin="round"/>
                            </svg>
                          </td>

                          <!-- Brand name -->
                          <td style="vertical-align:middle; font-weight:700; font-size:17px; color:#ffffff; letter-spacing:2px; text-transform:uppercase; font-family:'Barlow',Arial,sans-serif;">
                            FACTORY<span style="color:#93c5fd;">HUB</span>
                          </td>

                          <!-- Secure badge -->
                          <td align="right" style="vertical-align:middle;">
                            <span style="
                              background:rgba(255,255,255,0.12);
                              border:1px solid rgba(255,255,255,0.2);
                              border-radius:20px;
                              padding:4px 10px;
                              font-family:'Share Tech Mono',monospace;
                              font-size:10px;
                              color:#bfdbfe;
                              letter-spacing:1px;
                              white-space:nowrap;
                            ">
                              &#9679; SECURE
                            </span>
                          </td>

                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- ===== BODY ===== -->
                  <tr>
                    <td class="email-body" style="padding:30px 28px; background:#ffffff;">

                      <!-- Eyebrow label -->
                      <p style="margin:0 0 6px; font-family:'Share Tech Mono',monospace; font-size:10px; color:#93c5fd; letter-spacing:3px;">
                        // IDENTITY VERIFICATION
                      </p>

                      <!-- Title -->
                      <p class="main-title" style="margin:0 0 4px; font-size:21px; font-weight:600; color:#1e3a8a; line-height:1.3;">
                        Your One-Time<br>Access Code
                      </p>

                      <!-- Subtitle -->
                      <p style="margin:0 0 24px; font-size:13px; color:#6b7280;">
                        Enter this code to verify your identity and continue.
                      </p>

                      <!-- OTP BOX -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="
                        background:#eff6ff;
                        border:1px solid #bfdbfe;
                        border-left:4px solid #2563eb;
                        border-radius:6px;
                        margin-bottom:16px;
                      ">
                        <tr>
                          <td style="padding:20px 22px;">

                            <!-- OTP meta row -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                              <tr>
                                <td class="otp-meta-label" style="font-family:'Share Tech Mono',monospace; font-size:10px; color:#2563eb; letter-spacing:2px;">
                                  &#9654; ONE-TIME PASSCODE
                                </td>
                                <td class="otp-meta-timer" align="right" style="font-family:'Share Tech Mono',monospace; font-size:10px; color:#22c55e; letter-spacing:1px;">
                                  &#9679; EXPIRES IN 10:00
                                </td>
                              </tr>
                            </table>

                            <!-- OTP Code -->
                            <p class="otp-code" style="
                              margin:0;
                              font-family:'Share Tech Mono',monospace;
                              font-size:36px;
                              letter-spacing:8px;
                              color:#1e3a8a;
                              word-break:break-all;
                            ">
                              ${formatted}
                            </p>

                          </td>
                        </tr>
                      </table>

                      <!-- GREEN INFO CARD -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="
                        background:#f0fdf4;
                        border:1px solid #bbf7d0;
                        border-radius:6px;
                        margin-bottom:20px;
                      ">
                        <tr>
                          <td style="padding:12px 14px;">
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="vertical-align:top; padding-right:8px; font-family:'Share Tech Mono',monospace; font-size:11px; color:#16a34a; white-space:nowrap;">
                                  [&#10003;]
                                </td>
                                <td style="font-size:12px; color:#166534; line-height:1.6;">
                                  This code is valid for a single use only and expires in 10 minutes.
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- DIVIDER -->
                      <hr style="border:none; border-top:1px solid #dbeafe; margin:18px 0;">

                      <!-- WARNING -->
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align:top; padding-right:10px; font-family:'Share Tech Mono',monospace; font-size:12px; color:#3b82f6; white-space:nowrap;">
                            [!]
                          </td>
                          <td style="font-size:12px; color:#6b7280; line-height:1.7;">
                            Do not share this code with anyone. FactoryHub staff will never ask for your verification code. If you did not request this, please ignore this email.
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- ===== FOOTER ===== -->
                  <tr>
                    <td style="background:#eff6ff; border-top:1px solid #dbeafe; padding:14px 28px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td class="footer-left" style="font-family:'Share Tech Mono',monospace; font-size:10px; color:#93c5fd; letter-spacing:2px;">
                            FACTORYHUB // SECURE COMMS
                          </td>
                          <td class="footer-right" align="right">
                            <span style="
                              background:#ffffff;
                              border:1px solid #bbf7d0;
                              border-radius:20px;
                              padding:4px 10px;
                              font-family:'Share Tech Mono',monospace;
                              font-size:10px;
                              color:#16a34a;
                              letter-spacing:1px;
                              white-space:nowrap;
                            ">
                              &#9679; VERIFIED SENDER
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>

              </td>
            </tr>
          </table>

        </body>
        </html>
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