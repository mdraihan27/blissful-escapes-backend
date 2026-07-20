import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE, // true for 465, false for 587 (STARTTLS)
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export async function sendMail({ to, subject, text, html }) {
  return transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}

export async function sendLoginLinkEmail(loginUrl, expiresMinutes) {
  const subject = 'Your Blissful Escapes login link';
  const text = [
    'A login link was requested for your Blissful Escapes account.',
    '',
    `Use the link below to sign in. It expires in ${expiresMinutes} minutes and can be used only once.`,
    '',
    loginUrl,
    '',
    'If you did not request this, you can safely ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
      <h2>Blissful Escapes — Login Link</h2>
      <p>A login link was requested for your account.</p>
      <p>
        <a href="${loginUrl}"
           style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
          Sign in
        </a>
      </p>
      <p>This link expires in <strong>${expiresMinutes} minutes</strong> and can be used only once.</p>
      <p style="color:#666;font-size:13px;">If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  return sendMail({
    to: env.LOGIN_LINK_RECIPIENT_EMAIL,
    subject,
    text,
    html,
  });
}
