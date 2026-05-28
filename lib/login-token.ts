import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { digestLookupToken } from "@/lib/token-digest";

const SESSION_LOGIN_METHOD = "session";

export async function createSessionLoginToken(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.twoFactorChallenge.create({
    data: {
      codeHash: digestLookupToken(token),
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
      codeHash: digestLookupToken(token),
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
