import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : true,
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  } : undefined,
});

export async function sendEmailOTP(to: string, otp: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log(`\n\n=== MOCK EMAIL OTP ===\nTo: ${to}\nOTP: ${otp}\n======================\n\n`);
    return;
  }

  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; background-color: #FDFBF7; border: 1px solid #E7E0D3; border-radius: 16px; overflow: hidden; color: #292524;">
      <div style="background: linear-gradient(135deg, #2a1b18, #5a2a24); padding: 28px 24px; text-align: center;">
        <div style="font-size: 26px; color: #fbbf24; margin-bottom: 6px;">ॐ</div>
        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">Kashmiri Heritage Hub</h1>
        <p style="margin: 6px 0 0 0; color: #fde68a; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-family: sans-serif;">Account Verification</p>
      </div>
      <div style="padding: 32px 28px; text-align: center; font-family: sans-serif;">
        <p style="font-size: 15px; color: #57534e; line-height: 1.6; margin-top: 0;">Namaskar! Please use the 6-digit verification code below to verify your Kashmiri Heritage Hub account:</p>
        <div style="margin: 24px auto; padding: 16px 24px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; display: inline-block;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #92400e;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #78716c; margin-bottom: 0;">This code is valid for <strong>5 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Kashmiri Heritage Hub" <vitastahub@gmail.com>',
    to,
    subject: "Your Verification Code — Kashmiri Heritage Hub",
    text: `Your OTP for Kashmiri Heritage Hub account verification is: ${otp}. It is valid for 5 minutes.`,
    html,
  });
}

export async function sendPasswordResetOTP(to: string, otp: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log(`\n\n=== MOCK PASSWORD RESET OTP ===\nTo: ${to}\nOTP: ${otp}\n===============================\n\n`);
    return;
  }

  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; background-color: #FDFBF7; border: 1px solid #E7E0D3; border-radius: 16px; overflow: hidden; color: #292524;">
      <div style="background: linear-gradient(135deg, #2a1b18, #5a2a24); padding: 28px 24px; text-align: center;">
        <div style="font-size: 26px; color: #fbbf24; margin-bottom: 6px;">ॐ</div>
        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">Kashmiri Heritage Hub</h1>
        <p style="margin: 6px 0 0 0; color: #fde68a; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-family: sans-serif;">Password Reset Request</p>
      </div>
      <div style="padding: 32px 28px; text-align: center; font-family: sans-serif;">
        <p style="font-size: 15px; color: #57534e; line-height: 1.6; margin-top: 0;">Use the 6-digit security code below to reset your password:</p>
        <div style="margin: 24px auto; padding: 16px 24px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; display: inline-block;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #92400e;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #78716c; margin-bottom: 0;">This code is valid for <strong>5 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Kashmiri Heritage Hub" <vitastahub@gmail.com>',
    to,
    subject: "Password Reset Code — Kashmiri Heritage Hub",
    text: `Your OTP to reset your Kashmiri Heritage Hub password is: ${otp}. It is valid for 5 minutes.`,
    html,
  });
}
