import nodemailer from 'nodemailer';
import crypto from 'crypto';

// ─── Transporter created lazily — only when first email is sent ───────────────
// This ensures process.env is fully loaded before nodemailer reads it
let _transporter = null;

const getTransporter = () => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port:   Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return _transporter;
};

// Call this once after server starts to confirm connection
export const verifyEmailConnection = async () => {
  try {
    await getTransporter().verify();
    console.log('✅ Brevo SMTP ready — emails will be sent via smtp-relay.brevo.com');
  } catch (error) {
    console.error('❌ Brevo SMTP connection failed:', error.message);
  }
};

export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

const emailLayout = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0d0f14;font-family:'Inter',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0d0f14;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" style="max-width:480px;background-color:#1a1d26;border-radius:12px;border:1px solid #3a4253;">
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 24px 0;font-size:28px;font-weight:bold;color:#f04438;">CineVest</h1>
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #3a4253;">
              <p style="margin:0;color:#667591;font-size:12px;text-align:center;">
                &copy; ${new Date().getFullYear()} CineVest. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const FROM = () => `"CineVest" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;

const send = async ({ to, subject, html, text }) => {
  const info = await getTransporter().sendMail({
    from: FROM(),
    to,
    subject,
    html,
    text,
  });
  console.log(`✅ Email sent | messageId: ${info.messageId} | to: ${to}`);
  return info;
};

export const sendVerificationEmail = async (email, name, otp) => {
  const html = emailLayout(`
    <p style="margin:0 0 16px 0;color:#ffffff;font-size:18px;font-weight:600;">Hi ${name},</p>
    <p style="margin:0 0 24px 0;color:#b0b8c9;font-size:14px;line-height:1.6;">
      Welcome to CineVest! To complete your registration, verify your email using the code below:
    </p>
    <div style="background-color:#0d0f14;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
      <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#f04438;">${otp}</span>
    </div>
    <p style="margin:0 0 24px 0;color:#8592ab;font-size:13px;text-align:center;">
      This code expires in <strong style="color:#f97066;">10 minutes</strong>
    </p>
    <p style="margin:0;color:#667591;font-size:12px;line-height:1.5;">
      If you didn't create a CineVest account, ignore this email.
    </p>
  `);
  try {
    await send({ to: email, subject: 'Verify Your CineVest Account', html,
      text: `Hi ${name}, your CineVest verification code is: ${otp}. Expires in 10 minutes.` });
    return true;
  } catch (error) {
    console.error(`❌ sendVerificationEmail failed for ${email}:`, error.message);
    throw new Error('Failed to send verification email');
  }
};

export const sendPasswordResetEmail = async (email, name, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  const html = emailLayout(`
    <p style="margin:0 0 16px 0;color:#ffffff;font-size:18px;font-weight:600;">Hi ${name},</p>
    <p style="margin:0 0 24px 0;color:#b0b8c9;font-size:14px;line-height:1.6;">
      You requested a password reset. Click the button below to create a new password:
    </p>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${resetUrl}" style="display:inline-block;background-color:#d92d20;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
        Reset Password
      </a>
    </div>
    <p style="margin:0 0 16px 0;color:#8592ab;font-size:13px;text-align:center;">
      This link expires in <strong style="color:#f97066;">1 hour</strong>
    </p>
    <p style="margin:0 0 16px 0;color:#667591;font-size:12px;">If the button doesn't work, copy this link:</p>
    <p style="margin:0 0 24px 0;color:#4a6fa5;font-size:12px;word-break:break-all;">${resetUrl}</p>
    <p style="margin:0;color:#667591;font-size:12px;">If you didn't request this, ignore this email.</p>
  `);
  try {
    await send({ to: email, subject: 'Reset Your CineVest Password', html,
      text: `Hi ${name}, reset your password here: ${resetUrl} — expires in 1 hour.` });
    return true;
  } catch (error) {
    console.error(`❌ sendPasswordResetEmail failed for ${email}:`, error.message);
    throw new Error('Failed to send password reset email');
  }
};

export const sendInvestmentEmail = async (email, name, filmTitle, amount) => {
  const html = emailLayout(`
    <p style="margin:0 0 16px 0;color:#ffffff;font-size:18px;font-weight:600;">Hi ${name},</p>
    <p style="margin:0 0 24px 0;color:#b0b8c9;font-size:14px;line-height:1.6;">Your investment has been successfully submitted!</p>
    <div style="background-color:#0d0f14;border-radius:8px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;">
        <tr>
          <td style="padding:8px 0;color:#8592ab;font-size:13px;">Film</td>
          <td style="padding:8px 0;color:#ffffff;font-size:13px;text-align:right;font-weight:600;">${filmTitle}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#8592ab;font-size:13px;">Amount</td>
          <td style="padding:8px 0;color:#22c55e;font-size:13px;text-align:right;font-weight:600;">$${Number(amount).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#8592ab;font-size:13px;">Status</td>
          <td style="padding:8px 0;color:#f59e0b;font-size:13px;text-align:right;font-weight:600;">Pending Confirmation</td>
        </tr>
      </table>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${process.env.CLIENT_URL}/dashboard/investments" style="display:inline-block;background-color:#d92d20;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
        View Dashboard
      </a>
    </div>
    <p style="margin:0;color:#667591;font-size:12px;">Investing involves risk. Review all film details before investing further.</p>
  `);
  try {
    await send({ to: email, subject: `Investment Submitted — ${filmTitle}`, html,
      text: `Hi ${name}, your $${amount} investment in "${filmTitle}" has been submitted. Status: Pending.` });
    return true;
  } catch (error) {
    console.error(`❌ sendInvestmentEmail failed for ${email}:`, error.message);
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const html = emailLayout(`
    <p style="margin:0 0 16px 0;color:#ffffff;font-size:18px;font-weight:600;">Welcome aboard, ${name}! 🎬</p>
    <p style="margin:0 0 24px 0;color:#b0b8c9;font-size:14px;line-height:1.6;">
      Your CineVest account is now verified and ready to go. You now have access to:
    </p>
    <ul style="margin:0 0 24px 0;padding-left:20px;color:#b0b8c9;font-size:14px;line-height:2;">
      <li>Browse and invest in curated film projects</li>
      <li>Track your portfolio and ROI in real-time</li>
      <li>Connect your crypto wallet for seamless payments</li>
      <li>Chat with other investors and filmmakers</li>
    </ul>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${process.env.CLIENT_URL}/films" style="display:inline-block;background-color:#d92d20;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
        Browse Films
      </a>
    </div>
    <p style="margin:0;color:#667591;font-size:12px;">Questions? Reply to this email or visit our FAQ.</p>
  `);
  try {
    await send({ to: email, subject: 'Welcome to CineVest! 🎬', html,
      text: `Welcome ${name}! Your account is verified. Browse films at ${process.env.CLIENT_URL}/films` });
    return true;
  } catch (error) {
    console.error(`❌ sendWelcomeEmail failed for ${email}:`, error.message);
  }
};

export const sendInvestmentStatusEmail = async (email, name, filmTitle, amount, newStatus) => {
  const statusConfig = {
    confirmed: {
      label: 'Approved ✓', color: '#22c55e',
      subject: `Investment Approved — ${filmTitle}`,
      message: 'Great news! Your investment has been approved. Your ownership stake is now active.',
      cta: 'View Your Portfolio', ctaUrl: `${process.env.CLIENT_URL}/dashboard/portfolio`,
    },
    failed: {
      label: 'Rejected', color: '#ef4444',
      subject: `Investment Update — ${filmTitle}`,
      message: 'Your investment could not be verified and has been rejected. Contact support if you believe this is an error.',
      cta: 'Contact Support', ctaUrl: `${process.env.CLIENT_URL}/dashboard/investments`,
    },
    refunded: {
      label: 'Refunded', color: '#f59e0b',
      subject: `Investment Refunded — ${filmTitle}`,
      message: 'Your investment has been refunded to your original payment method.',
      cta: 'View Details', ctaUrl: `${process.env.CLIENT_URL}/dashboard/investments`,
    },
  };
  const cfg = statusConfig[newStatus];
  if (!cfg) return;
  const html = emailLayout(`
    <p style="margin:0 0 16px 0;color:#ffffff;font-size:18px;font-weight:600;">Hi ${name},</p>
    <p style="margin:0 0 24px 0;color:#b0b8c9;font-size:14px;line-height:1.6;">${cfg.message}</p>
    <div style="background-color:#0d0f14;border-radius:8px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;">
        <tr>
          <td style="padding:8px 0;color:#8592ab;font-size:13px;">Film</td>
          <td style="padding:8px 0;color:#ffffff;font-size:13px;text-align:right;font-weight:600;">${filmTitle}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#8592ab;font-size:13px;">Amount</td>
          <td style="padding:8px 0;color:#22c55e;font-size:13px;text-align:right;font-weight:600;">$${Number(amount).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#8592ab;font-size:13px;">Status</td>
          <td style="padding:8px 0;color:${cfg.color};font-size:13px;text-align:right;font-weight:600;">${cfg.label}</td>
        </tr>
      </table>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${cfg.ctaUrl}" style="display:inline-block;background-color:#d92d20;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
        ${cfg.cta}
      </a>
    </div>
    <p style="margin:0;color:#667591;font-size:12px;">Questions? Reply to this email.</p>
  `);
  try {
    await send({ to: email, subject: cfg.subject, html,
      text: `Hi ${name}, ${cfg.message} Film: ${filmTitle}. Amount: $${amount}. Status: ${cfg.label}.` });
    return true;
  } catch (error) {
    console.error(`❌ sendInvestmentStatusEmail failed for ${email}:`, error.message);
  }
};

export default {
  generateOTP,
  hashOTP,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendInvestmentEmail,
  sendInvestmentStatusEmail,
  sendWelcomeEmail,
};