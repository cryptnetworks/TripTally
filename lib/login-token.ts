import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const SESSION_LOGIN_METHOD = "session";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSessionLoginToken(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.twoFactorChallenge.create({
    data: {
      codeHash: hashToken(token),
      method: SESSION_LOGIN_METHOD,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
      userId
    }
  });
  return token;
}

export async function consumeSessionLoginToken(token: string) {
  const record = await prisma.twoFactorChallenge.findFirst({
    where: {
      codeHash: hashToken(token),
      method: SESSION_LOGIN_METHOD,
      usedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: { user: true }
  });

  if (!record) return null;

  await prisma.twoFactorChallenge.update({
    where: { id: record.id },
    data: { usedAt: new Date() }
  });

  return record.user;
}
