import crypto from "node:crypto";
import { digestLookupToken } from "@/lib/token-digest";
import { publicUrl } from "@/lib/url";
import { prisma } from "@/lib/prisma";

export async function createDiscordLinkToken({
  discordUserId,
  discordUsername,
  request
}: {
  discordUserId: string;
  discordUsername?: string;
  request?: Request;
}) {
  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.discordLinkToken.create({
    data: {
      tokenHash: digestLookupToken(token),
      discordUserId,
      discordUsername: discordUsername || null,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    }
  });
  return publicUrl(`/account?discordLinkToken=${encodeURIComponent(token)}`, request).toString();
}

export async function consumeDiscordLinkToken(token: string, userId: string) {
  const tokenHash = digestLookupToken(token);
  const linkToken = await prisma.discordLinkToken.findUnique({ where: { tokenHash } });
  if (!linkToken || linkToken.usedAt || linkToken.expiresAt < new Date()) return false;

  await prisma.$transaction([
    prisma.discordAccount.upsert({
      where: { userId },
      update: {
        discordUserId: linkToken.discordUserId,
        discordUsername: linkToken.discordUsername
      },
      create: {
        userId,
        discordUserId: linkToken.discordUserId,
        discordUsername: linkToken.discordUsername
      }
    }),
    prisma.discordLinkToken.update({
      where: { id: linkToken.id },
      data: { usedAt: new Date(), userId }
    })
  ]);
  return true;
}
