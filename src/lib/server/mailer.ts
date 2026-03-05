import nodemailer from 'nodemailer';
import {
  CONTACT_FROM_EMAIL,
  CONTACT_TO_EMAIL,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER
} from 'astro:env/server';

export interface ContactEmailPayload {
  email: string;
  message: string;
  name: string;
  clientIp: string;
  userAgent: string;
}

function toPortNumber(raw: string | undefined): number {
  const parsed = Number(raw ?? '587');
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 587;
}

function toBoolean(raw: string | undefined): boolean | undefined {
  if (!raw) {
    return undefined;
  }

  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

export async function sendContactEmail(payload: ContactEmailPayload): Promise<void> {
  const host = SMTP_HOST;
  const port = toPortNumber(SMTP_PORT);
  const user = SMTP_USER;
  const pass = SMTP_PASS;
  const to = CONTACT_TO_EMAIL;
  const from = CONTACT_FROM_EMAIL ?? user;
  const secure = toBoolean(SMTP_SECURE) ?? port === 465;

  if (!host || !user || !pass || !to || !from) {
    throw new Error('SMTP environment variables are incomplete.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });

  const text = [
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `IP: ${payload.clientIp}`,
    `User-Agent: ${payload.userAgent}`,
    '',
    payload.message
  ].join('\n');

  await transporter.sendMail({
    from,
    to,
    replyTo: payload.email,
    subject: `New contact form message from ${payload.name}`,
    text
  });
}
