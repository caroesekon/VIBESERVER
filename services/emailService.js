const nodemailer = require('nodemailer');
const config = require('../config/env');

let transporter = null;

const initTransporter = () => {
  if (!config.useEmail) {
    console.log('Email service disabled');
    return null;
  }

  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    console.error('Email configuration missing');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });

  console.log('Email transporter initialized');
  return transporter;
};

const sendEmail = async (to, subject, html, text = '') => {
  if (!transporter) {
    console.log('Email not sent: transporter not initialized');
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to Vibe!';
  const html = `
    <h1>Welcome, ${user.name}!</h1>
    <p>Thank you for joining Vibe. Start connecting with friends and sharing moments.</p>
  `;
  return sendEmail(user.email, subject, html);
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
  const subject = 'Password Reset Request';
  const html = `
    <h1>Reset Your Password</h1>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>This link expires in 1 hour.</p>
  `;
  return sendEmail(user.email, subject, html);
};

module.exports = {
  initTransporter,
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};