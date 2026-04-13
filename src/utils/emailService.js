/**
 * emailService.js — Nodemailer + Mailtrap (dev) / SMTP (production)
 *
 * Reads credentials from environment variables:
 *   EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
 *
 * In development: emails go to Mailtrap inbox (never reach real users)
 * In production:  swap env vars to real SMTP (SendGrid, Gmail, etc.)
 */

const nodemailer = require('nodemailer');

// ── Create transporter (singleton) ───────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   parseInt(process.env.EMAIL_PORT, 10) || 2525,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ── Helper: send any email ───────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: `"DiagnoSync" <noreply@diagnosync.com>`,
    to,
    subject,
    text: text || '',
    html,
  });
  console.log(`✉️  Email sent to ${to} | MessageId: ${info.messageId}`);
  return info;
};

// ── Welcome Email ────────────────────────────────────────────────────────────
exports.sendWelcomeEmail = async (email, name) => {
  try {
    await sendEmail({
      to: email,
      subject: 'Welcome to DiagnoSync!',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#2563EB">Welcome to DiagnoSync, ${name}! 🎉</h2>
          <p>Your account has been created successfully.</p>
          <p>You can now:</p>
          <ul>
            <li>Book appointments with doctors</li>
            <li>Track your prescriptions</li>
            <li>Use our AI symptom checker</li>
          </ul>
          <p>Visit your dashboard at <a href="${process.env.CORS_ORIGIN}">${process.env.CORS_ORIGIN}</a></p>
          <hr/>
          <p style="color:#6B7280;font-size:12px">DiagnoSync — AI-Powered Healthcare</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message);
    return false;
  }
};

// ── Password Reset Email ─────────────────────────────────────────────────────
exports.sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    await sendEmail({
      to: email,
      subject: 'Reset Your DiagnoSync Password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#2563EB">Password Reset Request 🔑</h2>
          <p>We received a request to reset your password.</p>
          <p>Click the button below to reset it. This link expires in <strong>1 hour</strong>.</p>
          <div style="text-align:center;margin:30px 0">
            <a href="${resetUrl}"
               style="background:#2563EB;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
              Reset Password
            </a>
          </div>
          <p style="color:#6B7280;font-size:13px">
            Or copy this link:<br/>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
          <p style="color:#6B7280;font-size:12px">
            If you didn't request this, you can safely ignore this email.
          </p>
          <hr/>
          <p style="color:#6B7280;font-size:12px">DiagnoSync — AI-Powered Healthcare</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    return false;
  }
};

// ── Appointment Reminder ─────────────────────────────────────────────────────
exports.sendAppointmentReminder = async (email, appointmentDetails) => {
  try {
    await sendEmail({
      to: email,
      subject: 'Appointment Reminder — DiagnoSync',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#2563EB">Appointment Reminder 📅</h2>
          <p>You have an upcoming appointment:</p>
          <ul>
            <li><strong>Date:</strong> ${appointmentDetails?.date || 'N/A'}</li>
            <li><strong>Time:</strong> ${appointmentDetails?.time || 'N/A'}</li>
            <li><strong>Doctor:</strong> ${appointmentDetails?.doctor || 'N/A'}</li>
            <li><strong>Type:</strong> ${appointmentDetails?.type || 'N/A'}</li>
          </ul>
          <hr/>
          <p style="color:#6B7280;font-size:12px">DiagnoSync — AI-Powered Healthcare</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('❌ Error sending appointment reminder:', error.message);
    return false;
  }
};

// ── Prescription Notification ────────────────────────────────────────────────
exports.sendPrescriptionNotification = async (email, prescriptionDetails) => {
  try {
    await sendEmail({
      to: email,
      subject: 'New Prescription — DiagnoSync',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#2563EB">New Prescription 💊</h2>
          <p>A new prescription has been added to your account.</p>
          <ul>
            <li><strong>Medication:</strong> ${prescriptionDetails?.medication || 'N/A'}</li>
            <li><strong>Dosage:</strong> ${prescriptionDetails?.dosage || 'N/A'}</li>
            <li><strong>Instructions:</strong> ${prescriptionDetails?.instructions || 'N/A'}</li>
          </ul>
          <hr/>
          <p style="color:#6B7280;font-size:12px">DiagnoSync — AI-Powered Healthcare</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('❌ Error sending prescription notification:', error.message);
    return false;
  }
};

// ── Generic Notification ─────────────────────────────────────────────────────
exports.sendNotification = async (email, subject, message) => {
  try {
    await sendEmail({
      to: email,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#2563EB">${subject}</h2>
          <p>${message}</p>
          <hr/>
          <p style="color:#6B7280;font-size:12px">DiagnoSync — AI-Powered Healthcare</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('❌ Error sending notification:', error.message);
    return false;
  }
};