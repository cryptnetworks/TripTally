import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";

type ResetEmailInput = {
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
};

function smtpConfigured() {
  if (process.env.SMTP_ENABLED === "false") {
    return false;
  }
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

function smtpPort() {
  const parsed = Number(process.env.SMTP_PORT || "587");
  return Number.isFinite(parsed) ? parsed : 587;
}

function baseTransportOptions() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  return {
    host: process.env.SMTP_HOST,
    port: smtpPort(),
    secure: process.env.SMTP_SECURE === "true",
    auth: user && pass ? { user, pass } : undefined
  };
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  expiresInMinutes
}: ResetEmailInput) {
  if (!smtpConfigured()) {
    logger.info("email.password_reset.disabled");
    if (process.env.NODE_ENV !== "production") {
      logger.info("email.password_reset.dev_link", { resetUrl });
    }
    return;
  }

  const transporter = nodemailer.createTransport(baseTransportOptions());
  const from = process.env.SMTP_FROM as string;
  const appName = process.env.EMAIL_APP_NAME || "TripTally";

  try {
    await transporter.sendMail({
      from,
      to,
      subject: "Reset your TripTally password",
      text: [
        "Reset your TripTally password",
        "",
        `Open this link within ${expiresInMinutes} minutes to choose a new password:`,
        resetUrl,
        "",
        "If you did not request this, you can ignore this email."
      ].join("\n"),
      html: `
        <div style="margin:0;padding:0;background:#f7f9fb;font-family:Arial,sans-serif;color:#18212f;">
          <div style="max-width:520px;margin:0 auto;padding:28px 16px;">
            <div style="background:#ffffff;border:1px solid #dbe3ec;border-radius:12px;padding:24px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;">${appName}</p>
              <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;color:#18212f;">Reset your password</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#657386;">Use the secure link below to choose a new password. It expires in ${expiresInMinutes} minutes.</p>
              <a href="${resetUrl}" style="display:block;text-align:center;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:10px;padding:14px 18px;font-size:16px;font-weight:700;">Reset password</a>
              <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#657386;">If the button does not work, copy and paste this link into your browser:<br><span style="word-break:break-all;color:#0f766e;">${resetUrl}</span></p>
              <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#657386;">If you did not request this, you can ignore this email.</p>
            </div>
          </div>
        </div>
      `
    });
  } catch (error) {
    logger.error("email.password_reset.failed", {
      error: error instanceof Error ? error.message : "Unknown email error"
    });
    return;
  }

  logger.info("email.password_reset.sent", { to });
}
