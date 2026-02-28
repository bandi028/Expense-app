import { getTransporter } from '../config/mailer.js';

export const sendEmailOTP = async (email, otp) => {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Expense Tracker" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Your OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f172a; border-radius: 12px; color: #e2e8f0;">
        <h1 style="font-size: 22px; color: #6366f1; margin-bottom: 8px;">Expense Tracker</h1>
        <p style="color: #94a3b8; margin-bottom: 24px;">Your One-Time Password</p>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #6366f1;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">This OTP is valid for <strong style="color:#e2e8f0">5 minutes</strong>. Do not share it with anyone.</p>
        <p style="color: #475569; font-size: 12px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (email, otp) => {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Expense Tracker" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f172a; border-radius: 12px; color: #e2e8f0;">
        <h1 style="font-size: 22px; color: #ef4444; margin-bottom: 8px;">Password Reset</h1>
        <p style="color: #94a3b8; margin-bottom: 24px;">Use this OTP to reset your password</p>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #ef4444;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">Valid for <strong style="color:#e2e8f0">5 minutes</strong>.</p>
      </div>
    `,
  });
};
