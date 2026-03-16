/**
 * ===========================================
 * Email Utility
 * ===========================================
 *
 * Handles sending emails for verification, notifications, etc.
 * Uses Nodemailer with SMTP configuration.
 * All emails use branded HTML templates.
 */

import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create a single shared transporter (not one per email call)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  // Do NOT set ciphers: 'SSLv3' — it is deprecated and rejected by Gmail on production servers
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Generate a 6-digit OTP code (cryptographically secure)
 * @returns {string} 6-digit OTP
 */
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hash an OTP for secure storage
 * @param {string} otp - Plain-text OTP
 * @returns {string} SHA-256 hashed OTP
 */
export const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

// ─── Reusable HTML email layout ──────────────────────────────
const emailLayout = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0d0f14; font-family: 'Inter', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0d0f14;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 480px; background-color: #1a1d26; border-radius: 12px; border: 1px solid #3a4253;">
          <tr>
            <td style="padding: 40px;">
              <!-- Logo -->
              <h1 style="margin: 0 0 24px 0; font-size: 28px; font-weight: bold; background: linear-gradient(to right, #f97066, #d92d20); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                CineVest
              </h1>
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #3a4253;">
              <p style="margin: 0; color: #667591; font-size: 12px; text-align: center;">
                &copy; ${new Date().getFullYear()} CineVest. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Send verification OTP email
 */
export const sendVerificationEmail = async (email, name, otp) => {
  const html = emailLayout(`
    <p style="margin: 0 0 16px 0; color: #ffffff; font-size: 18px; font-weight: 600;">
      Hi ${name},
    </p>
    <p style="margin: 0 0 24px 0; color: #b0b8c9; font-size: 14px; line-height: 1.6;">
      Welcome to CineVest! To complete your registration and start investing in films, please verify your email address using the code below:
    </p>
    <div style="background-color: #0d0f14; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #f04438;">
        ${otp}
      </span>
    </div>
    <p style="margin: 0 0 24px 0; color: #8592ab; font-size: 13px; text-align: center;">
      This code expires in <strong style="color: #f97066;">10 minutes</strong>
    </p>
    <p style="margin: 0; color: #667591; font-size: 12px; line-height: 1.5;">
      If you didn't create an account with CineVest, you can safely ignore this email.
    </p>
  `);

  const mailOptions = {
    from: `"CineVest" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your CineVest Account',
    html,
    text: `Hi ${name}, Welcome to CineVest! Your verification code is: ${otp}. This code expires in 10 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending email to ${email}:`, error.message);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, name, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const html = emailLayout(`
    <p style="margin: 0 0 16px 0; color: #ffffff; font-size: 18px; font-weight: 600;">
      Hi ${name},
    </p>
    <p style="margin: 0 0 24px 0; color: #b0b8c9; font-size: 14px; line-height: 1.6;">
      You requested to reset your password. Click the button below to create a new password:
    </p>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${resetUrl}" style="display: inline-block; background-color: #d92d20; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
        Reset Password
      </a>
    </div>
    <p style="margin: 0 0 16px 0; color: #8592ab; font-size: 13px; text-align: center;">
      This link expires in <strong style="color: #f97066;">1 hour</strong>
    </p>
    <p style="margin: 0 0 16px 0; color: #667591; font-size: 12px; line-height: 1.5;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="margin: 0 0 24px 0; color: #4a6fa5; font-size: 12px; word-break: break-all;">
      ${resetUrl}
    </p>
    <p style="margin: 0; color: #667591; font-size: 12px; line-height: 1.5;">
      If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
  `);

  const mailOptions = {
    from: `"CineVest" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Reset Your CineVest Password',
    html,
    text: `Hi ${name}, Reset your password here: ${resetUrl}. This link expires in 1 hour.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending email to ${email}:`, error.message);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send investment confirmation email
 */
export const sendInvestmentEmail = async (email, name, filmTitle, amount) => {
  const html = emailLayout(`
    <p style="margin: 0 0 16px 0; color: #ffffff; font-size: 18px; font-weight: 600;">
      Hi ${name},
    </p>
    <p style="margin: 0 0 24px 0; color: #b0b8c9; font-size: 14px; line-height: 1.6;">
      Your investment has been successfully submitted! Here are the details:
    </p>
    <div style="background-color: #0d0f14; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; color: #8592ab; font-size: 13px;">Film</td>
          <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right; font-weight: 600;">${filmTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #8592ab; font-size: 13px;">Amount</td>
          <td style="padding: 8px 0; color: #22c55e; font-size: 13px; text-align: right; font-weight: 600;">$${Number(amount).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #8592ab; font-size: 13px;">Status</td>
          <td style="padding: 8px 0; color: #f59e0b; font-size: 13px; text-align: right; font-weight: 600;">Pending Confirmation</td>
        </tr>
      </table>
    </div>
    <p style="margin: 0 0 24px 0; color: #b0b8c9; font-size: 14px; line-height: 1.6;">
      You can track the status of your investment from your dashboard. We'll notify you once it's confirmed.
    </p>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${process.env.CLIENT_URL}/dashboard/investments" style="display: inline-block; background-color: #d92d20; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
        View Dashboard
      </a>
    </div>
    <p style="margin: 0; color: #667591; font-size: 12px; line-height: 1.5;">
      Investing involves risk. Please review the film's details and our disclaimer before making further investments.
    </p>
  `);

  const mailOptions = {
    from: `"CineVest" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Investment Submitted — ${filmTitle}`,
    html,
    text: `Hi ${name}, Your $${amount} investment in "${filmTitle}" has been submitted. Status: Pending Confirmation.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Investment email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending investment email to ${email}:`, error.message);
    // Don't throw — investment email is non-critical
  }
};

/**
 * Send welcome email after successful verification
 */
export const sendWelcomeEmail = async (email, name) => {
  const html = emailLayout(`
    <p style="margin: 0 0 16px 0; color: #ffffff; font-size: 18px; font-weight: 600;">
      Welcome aboard, ${name}! 🎬
    </p>
    <p style="margin: 0 0 24px 0; color: #b0b8c9; font-size: 14px; line-height: 1.6;">
      Your CineVest account is now verified and ready to go. You now have access to:
    </p>
    <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #b0b8c9; font-size: 14px; line-height: 2;">
      <li>Browse and invest in curated film projects</li>
      <li>Track your portfolio and ROI in real-time</li>
      <li>Connect your crypto wallet for seamless payments</li>
      <li>Chat with other investors and filmmakers</li>
    </ul>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${process.env.CLIENT_URL}/films" style="display: inline-block; background-color: #d92d20; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
        Browse Films
      </a>
    </div>
    <p style="margin: 0; color: #667591; font-size: 12px; line-height: 1.5;">
      If you have any questions, reply to this email or visit our FAQ.
    </p>
  `);

  const mailOptions = {
    from: `"CineVest" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Welcome to CineVest! 🎬',
    html,
    text: `Welcome aboard, ${name}! Your CineVest account is verified. Start browsing films at ${process.env.CLIENT_URL}/films`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending welcome email to ${email}:`, error.message);
    // Don't throw — welcome email is non-critical
  }
};

/**
 * Send investment status update email (approved / rejected / refunded)
 */
export const sendInvestmentStatusEmail = async (email, name, filmTitle, amount, newStatus) => {
  const statusConfig = {
    confirmed: {
      label: 'Approved ✓',
      color: '#22c55e',
      subject: `Investment Approved — ${filmTitle}`,
      message: 'Great news! Your investment has been reviewed and approved. Your ownership stake is now active.',
      cta: 'View Your Portfolio',
      ctaUrl: `${process.env.CLIENT_URL}/dashboard/portfolio`,
    },
    failed: {
      label: 'Rejected',
      color: '#ef4444',
      subject: `Investment Update — ${filmTitle}`,
      message: 'Unfortunately, your investment could not be verified and has been rejected. If you believe this is an error, please contact support.',
      cta: 'Contact Support',
      ctaUrl: `${process.env.CLIENT_URL}/dashboard/investments`,
    },
    refunded: {
      label: 'Refunded',
      color: '#f59e0b',
      subject: `Investment Refunded — ${filmTitle}`,
      message: 'Your investment has been refunded. The amount will be returned to your original payment method.',
      cta: 'View Details',
      ctaUrl: `${process.env.CLIENT_URL}/dashboard/investments`,
    },
  };

  const cfg = statusConfig[newStatus];
  if (!cfg) return; // nothing to send for 'pending'

  const html = emailLayout(`
    <p style="margin: 0 0 16px 0; color: #ffffff; font-size: 18px; font-weight: 600;">
      Hi ${name},
    </p>
    <p style="margin: 0 0 24px 0; color: #b0b8c9; font-size: 14px; line-height: 1.6;">
      ${cfg.message}
    </p>
    <div style="background-color: #0d0f14; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; color: #8592ab; font-size: 13px;">Film</td>
          <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right; font-weight: 600;">${filmTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #8592ab; font-size: 13px;">Amount</td>
          <td style="padding: 8px 0; color: #22c55e; font-size: 13px; text-align: right; font-weight: 600;">$${Number(amount).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #8592ab; font-size: 13px;">Status</td>
          <td style="padding: 8px 0; color: ${cfg.color}; font-size: 13px; text-align: right; font-weight: 600;">${cfg.label}</td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${cfg.ctaUrl}" style="display: inline-block; background-color: #d92d20; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
        ${cfg.cta}
      </a>
    </div>
    <p style="margin: 0; color: #667591; font-size: 12px; line-height: 1.5;">
      If you have questions about this update, reply to this email.
    </p>
  `);

  const mailOptions = {
    from: `"CineVest" <${process.env.SMTP_USER}>`,
    to: email,
    subject: cfg.subject,
    html,
    text: `Hi ${name}, ${cfg.message} Film: ${filmTitle}. Amount: $${amount}. Status: ${cfg.label}.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Investment status email (${newStatus}) sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending investment status email to ${email}:`, error.message);
  }
};

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP connection failed:', error.message, '| Code:', error.code);
  } else {
    console.log('✅ SMTP server is ready to send emails');
  }
});

export default {
  generateOTP,
  hashOTP,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendInvestmentEmail,
  sendInvestmentStatusEmail,
  sendWelcomeEmail,
};