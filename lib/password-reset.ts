import crypto from "crypto";
import * as bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export const DEFAULT_RESET_EXPIRATION_MINUTES = 45;

export type PasswordResetRecord = {
  id: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  userId: string;
};

export type PasswordResetStore = {
  findByTokenHash(tokenHash: string): Promise<PasswordResetRecord | null>;
  updatePasswordAndMarkTokenUsed(input: {
    userId: string;
    tokenId: string;
    passwordHash: string;
    usedAt: Date;
  }): Promise<void>;
};

export function passwordResetExpirationMinutes() {
  const configured = Number(process.env.PASSWORD_RESET_TOKEN_MINUTES || "");
  if (Number.isFinite(configured) && configured >= 30 && configured <= 60) {
    return configured;
  }
  return DEFAULT_RESET_EXPIRATION_MINUTES;
}

export function generatePasswordResetToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashPasswordResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function passwordResetExpiresAt(now = new Date()) {
  return new Date(now.getTime() + passwordResetExpirationMinutes() * 60 * 1000);
}

export function isPasswordResetTokenExpired(record: Pick<PasswordResetRecord, "expiresAt">, now = new Date()) {
  return record.expiresAt.getTime() <= now.getTime();
}

export function buildPasswordResetUrl(token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function createPasswordResetForUser(user: { id: string; email: string }) {
  const token = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(token);
  const expiresInMinutes = passwordResetExpirationMinutes();
  const now = new Date();

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: now }
    }),
    prisma.passwordResetToken.create({
      data: {
        tokenHash,
        expiresAt: new Date(now.getTime() + expiresInMinutes * 60 * 1000),
        userId: user.id
      }
    })
  ]);

  await sendPasswordResetEmail({
    to: user.email,
    resetUrl: buildPasswordResetUrl(token),
    expiresInMinutes
  });

  logger.info("auth.password_reset.created", { userId: user.id });
}

export function validatePasswordResetRecord(
  record: PasswordResetRecord | null,
  now = new Date()
) {
  if (!record || record.usedAt || isPasswordResetTokenExpired(record, now)) {
    return false;
  }
  return true;
}

export async function completePasswordReset(token: string, password: string) {
  return completePasswordResetWithStore(token, password, {
    findByTokenHash: (tokenHash) => prisma.passwordResetToken.findUnique({ where: { tokenHash } }),
    updatePasswordAndMarkTokenUsed: async ({ userId, tokenId, passwordHash, usedAt }) => {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { passwordHash }
        }),
        prisma.passwordResetToken.update({
          where: { id: tokenId },
          data: { usedAt }
        })
      ]);
    }
  });
}

export async function completePasswordResetWithStore(
  token: string,
  password: string,
  store: PasswordResetStore,
  now = new Date()
) {
  const tokenHash = hashPasswordResetToken(token);
  const record = await store.findByTokenHash(tokenHash);

  if (!record || !validatePasswordResetRecord(record, now)) {
    logger.warn("auth.password_reset.invalid_token");
    return false;
  }

  await store.updatePasswordAndMarkTokenUsed({
    userId: record.userId,
    tokenId: record.id,
    passwordHash: await bcrypt.hash(password, 12),
    usedAt: now
  });

  logger.info("auth.password_reset.completed", { userId: record.userId });
  return true;
}
