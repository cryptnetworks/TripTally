"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserId } from "@/lib/actions/session";
import { consumeDiscordLinkToken } from "@/lib/discord/linking";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { formString } from "@/lib/validation";

export async function linkDiscordAccount(formData: FormData) {
  const userId = await requireCurrentUserId();
  const token = formString(formData, "discordLinkToken");
  const linked = token ? await consumeDiscordLinkToken(token, userId) : false;
  if (!linked) {
    logger.warn("discord.link.failed", { userId });
    redirect("/account?discord=invalid");
  }

  logger.info("discord.link.success", { userId });
  revalidatePath("/account");
  redirect("/account?discord=linked");
}

export async function unlinkDiscordAccount() {
  const userId = await requireCurrentUserId();
  await prisma.discordAccount.deleteMany({ where: { userId } });
  logger.info("discord.unlink.success", { userId });
  revalidatePath("/account");
  redirect("/account?discord=unlinked");
}
