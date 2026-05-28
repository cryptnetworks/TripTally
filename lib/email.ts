import { SMTPClient } from "emailjs";
import { logger } from "@/lib/logger";

type ResetEmailInput = {
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
};

type VerificationEmailInput = {
  to: string;
  verifyUrl: string;
  expiresInHours: number;
};

type TwoFactorEmailInput = {
  to: string;
  code: string;
  expiresInMinutes: number;
};

type EmailMessage = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
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
  const secure = process.env.SMTP_SECURE === "true";
  return {
    host: process.env.SMTP_HOST,
    port: smtpPort(),
    ssl: secure,
    tls: !secure,
    user,
    password: pass
  };
}

async function sendSmtpEmail(message: EmailMessage) {
  const client = new SMTPClient(baseTransportOptions());

  try {
    await client.sendAsync({
      from: message.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      attachment: [
        {
          data: message.html,
          alternative: true,
          type: "text/html"
        }
      ]
    });
  } finally {
    client.smtp.close();
  }
}

export async function sendPasswordResetEmail({ to, resetUrl, expiresInMinutes }: ResetEmailInput) {
  if (!smtpConfigured()) {
    logger.info("email.password_reset.disabled");
    if (process.env.NODE_ENV !== "production") {
      logger.info("email.password_reset.dev_link", { resetUrl });
    }
    return;
  }

  const from = process.env.SMTP_FROM as string;
  const appName = process.env.EMAIL_APP_NAME || "Trip Tally";

  try {
    await sendSmtpEmail({
      from,
      to,
      subject: `Reset your ${appName} password`,
      text: [
        `Reset your ${appName} password`,
        "",
        `Open this link within ${expiresInMinutes} minutes to choose a new password:`,
        resetUrl,
        "",
        "If you did not request this, you can ignore this email."
      ].join("\n"),
      html: brandedEmailTemplate({
        appName,
        title: "Reset your password",
        intro: `Use the secure link below to choose a new password. It expires in ${expiresInMinutes} minutes.`,
        ctaLabel: "Reset password",
        ctaUrl: resetUrl,
        footer: "If you did not request this, you can ignore this email."
      })
    });
  } catch (error) {
    logger.error("email.password_reset.failed", {
      error: error instanceof Error ? error.message : "Unknown email error"
    });
    return;
  }

  logger.info("email.password_reset.sent", { to });
}

export async function sendEmailVerificationEmail({
  to,
  verifyUrl,
  expiresInHours
}: VerificationEmailInput) {
  if (!smtpConfigured()) {
    logger.info("email.verification.disabled");
    if (process.env.NODE_ENV !== "production") {
      logger.info("email.verification.dev_link", { verifyUrl });
    }
    return;
  }

  const from = process.env.SMTP_FROM as string;
  const appName = process.env.EMAIL_APP_NAME || "Trip Tally";

  try {
    await sendSmtpEmail({
      from,
      to,
      subject: `Verify your ${appName} account`,
      text: [
        `Verify your ${appName} account`,
        "",
        `Open this link within ${expiresInHours} hours to verify your email address:`,
        verifyUrl,
        "",
        "If you did not create this account, you can ignore this email."
      ].join("\n"),
      html: brandedEmailTemplate({
        appName,
        title: "Verify your email",
        intro: `Confirm this email address to finish setting up your account. This link expires in ${expiresInHours} hours.`,
        ctaLabel: "Verify email",
        ctaUrl: verifyUrl,
        footer: "If you did not create this account, you can ignore this email."
      })
    });
  } catch (error) {
    logger.error("email.verification.failed", {
      error: error instanceof Error ? error.message : "Unknown email error"
    });
    return;
  }

  logger.info("email.verification.sent", { to });
}

export async function sendTwoFactorEmail({ to, code, expiresInMinutes }: TwoFactorEmailInput) {
  if (!smtpConfigured()) {
    logger.warn("email.two_factor.disabled");
    if (process.env.NODE_ENV !== "production") {
      logger.info("email.two_factor.dev_code", { code });
    }
    return;
  }

  const from = process.env.SMTP_FROM as string;
  const appName = process.env.EMAIL_APP_NAME || "Trip Tally";

  try {
    await sendSmtpEmail({
      from,
      to,
      subject: `${appName} sign-in code`,
      text: [
        `Your ${appName} sign-in code is ${code}.`,
        "",
        `It expires in ${expiresInMinutes} minutes.`,
        "",
        "If you did not try to sign in, change your password."
      ].join("\n"),
      html: brandedEmailTemplate({
        appName,
        title: "Your sign-in code",
        intro: `Use this code to finish signing in. It expires in ${expiresInMinutes} minutes.`,
        code,
        footer: "If you did not try to sign in, change your password."
      })
    });
  } catch (error) {
    logger.error("email.two_factor.failed", {
      error: error instanceof Error ? error.message : "Unknown email error"
    });
    return;
  }

  logger.info("email.two_factor.sent", { to });
}

function brandedEmailTemplate(input: {
  appName: string;
  title: string;
  intro: string;
  ctaLabel?: string;
  ctaUrl?: string;
  code?: string;
  footer: string;
}) {
  const action = input.ctaUrl
    ? `<a href="${input.ctaUrl}" style="display:block;text-align:center;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:10px;padding:14px 18px;font-size:16px;font-weight:700;">${input.ctaLabel}</a>
       <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#657386;">If the button does not work, copy and paste this link into your browser:<br><span style="word-break:break-all;color:#0f766e;">${input.ctaUrl}</span></p>`
    : `<div style="margin:20px 0;text-align:center;font-size:32px;letter-spacing:.24em;font-weight:800;color:#18212f;">${input.code}</div>`;

  return `
    <div style="margin:0;padding:0;background:#f7f9fb;font-family:Arial,sans-serif;color:#18212f;">
      <div style="max-width:540px;margin:0 auto;padding:28px 16px;">
        <div style="background:#ffffff;border:1px solid #dbe3ec;border-radius:14px;padding:26px;">
          <div style="margin:0 0 18px;padding:12px;border-radius:12px;background:#eef8f6;text-align:center;">
            <strong style="font-size:22px;color:#18212f;">${input.appName}</strong>
          </div>
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;">Travel costs, settled clearly</p>
          <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;color:#18212f;">${input.title}</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#657386;">${input.intro}</p>
          ${action}
          <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#657386;">${input.footer}</p>
        </div>
      </div>
    </div>
  `;
}
