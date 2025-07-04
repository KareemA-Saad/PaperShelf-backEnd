const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Email options
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message, // Use HTML if provided, otherwise use text
  };

  // Send email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw new Error('Email could not be sent');
  }
};

// Generate OTP code
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

// Email templates
const emailTemplates = {
  // Email verification OTP template
  verificationOTP: (name, otp) => ({
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to PaperShelf!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for registering with us. Please verify your email address using the verification code below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 10px; padding: 20px; display: inline-block;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
        </div>
        <p style="text-align: center; color: #666;">Enter this 6-digit code in the verification page</p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <p>Best regards,<br>The PaperShelf Team</p>
      </div>
    `
  }),

  // Password reset OTP template
  passwordResetOTP: (name, otp) => ({
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>You requested to reset your password. Use the verification code below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #f8f9fa; border: 2px solid #dc3545; border-radius: 10px; padding: 20px; display: inline-block;">
            <h1 style="color: #dc3545; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
        </div>
        <p style="text-align: center; color: #666;">Enter this 6-digit code in the password reset page</p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The PaperShelf Team</p>
      </div>
    `
  }),

  // Password changed notification template
  passwordChangedNotification: (name, resetLink) => ({
    subject: 'Your Password Was Changed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Changed</h2>
        <p>Hi ${name},</p>
        <p>Your password was recently changed. If this was you, you can safely ignore this email.</p>
        <p>If you did <b>not</b> change your password, please reset your password immediately using the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #dc3545; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 18px;">Reset Password</a>
        </div>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>The PaperShelf Team</p>
      </div>
    `
  })
};

module.exports = {
  sendEmail,
  emailTemplates,
  generateOTP
};
