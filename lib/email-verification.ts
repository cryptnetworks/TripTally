import crypto from "crypto";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { sendEmailVerificationEmail } from "@/lib/email";

const VERIFICATION_EXPIRATION_HOURS = 24;

function generateVerificationToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildVerificationUrl(token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
}

export async function createEmailVerificationForUser(user: { id: string; email: string }) {
  const token = generateVerificationToken();
  const now = new Date();

  await prisma.$transaction([
    prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: now }
    }),
    prisma.emailVerificationToken.create({
      data: {
        tokenHash: hashToken(token),
        expiresAt: new Date(now.getTime() + VERIFICATION_EXPIRATION_HOURS * 60 * 60 * 1000),
        userId: user.id
      }
    })
  ]);

  await sendEmailVerificationEmail({
    to: user.email,
    verifyUrl: buildVerificationUrl(token),
    expiresInHours: VERIFICATION_EXPIRATION_HOURS
  });

  logger.info("auth.email_verification.created", { userId: user.id });
}

export async function verifyEmailToken(token: string) {
  const now = new Date();
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) }
  });

  if (!record || record.usedAt || record.expiresAt.getTime() <= now.getTime()) {
    logger.warn("auth.email_verification.invalid_token");
    return false;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: now }
    }),
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: now }
    })
  ]);

  logger.info("auth.email_verification.completed", { userId: record.userId });
  return true;
}
