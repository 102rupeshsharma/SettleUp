import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporterInstance = null;

const getTransporter = async () => {
  if (transporterInstance) return transporterInstance;

  let user = env.EMAIL_USER;
  let pass = env.EMAIL_PASS;
  let host = env.EMAIL_HOST;
  let port = env.EMAIL_PORT;

  // Auto-generate test account if empty
  if (!user || !pass) {
    console.log('\x1b[33m[Mailer] No SMTP credentials provided in .env. Creating Ethereal test account...\x1b[0m');
    try {
      const testAccount = await nodemailer.createTestAccount();
      user = testAccount.user;
      pass = testAccount.pass;
      host = testAccount.smtp.host;
      port = testAccount.smtp.port;
      console.log(`\x1b[32m[Mailer] Ethereal account created!\x1b[0m`);
      console.log(`\x1b[32m  User: ${user}\x1b[0m`);
      console.log(`\x1b[32m  Pass: ${pass}\x1b[0m`);
    } catch (err) {
      console.error('\x1b[31m[Mailer] Failed to create Ethereal test account:\x1b[0m', err.message);
      throw err;
    }
  }

  transporterInstance = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  return transporterInstance;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = await getTransporter();

    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });

    console.log(`\x1b[32m[Mailer] Email sent to ${to}. Message ID: ${info.messageId}\x1b[0m`);
    
    // Preview URL is only available when sending through an Ethereal account
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`\x1b[34m[Mailer] Ethereal Preview URL: ${previewUrl}\x1b[0m`);
    }
    return info;
  } catch (error) {
    console.error('\x1b[31m[Mailer Error] Failed to send email:\x1b[0m', error.message);
    throw error;
  }
};
