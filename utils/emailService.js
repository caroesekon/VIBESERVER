const nodemailer = require('nodemailer');
const config = require('../config/env');

let transporter = null;

const initTransporter = () => {
  if (!config.useEmail) return null;
  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
  return transporter;
};

const sendEmail = async (to, subject, html, text = '') => {
  if (!transporter) return false;
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
    console.error('Send email error:', error);
    return false;
  }
};

module.exports = { initTransporter, sendEmail };