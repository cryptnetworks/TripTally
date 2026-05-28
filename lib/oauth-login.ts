import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { digestLookupToken } from "@/lib/token-digest";

export function generateOAuthLoginToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export async function createOAuthLoginToken(userId: string) {
  const token = generateOAuthLoginToken();
  await prisma.oAuthLoginToken.create({
    data: {
      tokenHash: digestLookupToken(token),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      userId
    }
  });
  return token;
}

export async function consumeOAuthLoginToken(token: string) {
  const record = await prisma.oAuthLoginToken.findUnique({
    where: { tokenHash: digestLookupToken(token) },
    include: { user: true }
  });

  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  await prisma.oAuthLoginToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() }
  });

  return record.user;
}
