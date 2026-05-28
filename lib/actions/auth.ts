"use server";

import * as bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { completePasswordReset, createPasswordResetForUser } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  accountPasswordSchema,
  accountProfileSchema,
  forgotPasswordSchema,
  formString,
  registerSchema,
  resetPasswordSchema
} from "@/lib/validation";
import { requireUser } from "@/lib/session";

export async function registerUser(formData: FormData) {
  const parsed = registerSchema.safeParse({
    username: formString(formData, "username"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword")
  });

  if (!parsed.success) {
    logger.warn("auth.register.validation_failed");
    redirect("/register?error=invalid");
  }

  const email = parsed.data.email;
  const rateLimit = checkRateLimit(`register:${email}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000
  });
  if (!rateLimit.allowed) {
    logger.warn("auth.register.rate_limited", { email });
    redirect("/register?error=rate-limit");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username: parsed.data.username }]
    }
  });

  if (existingUser) {
    logger.warn("auth.register.duplicate", { email });
    redirect("/register?error=exists");
  }

  await prisma.user.create({
    data: {
      username: parsed.data.username,
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12)
    }
  });

  logger.info("auth.register.created", { email });
  redirect("/login?registered=1");
}

export async function requestPasswordReset(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formString(formData, "email")
  });

  if (!parsed.success) {
    logger.warn("auth.password_reset.request.validation_failed");
    redirect("/forgot-password?sent=1");
  }

  const email = parsed.data.email;
  const rateLimit = checkRateLimit(`password-reset:${email}`, {
    limit: 3,
    windowMs: 60 * 60 * 1000
  });

  if (!rateLimit.allowed) {
    logger.warn("auth.password_reset.request.rate_limited", { email });
    redirect("/forgot-password?sent=1");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await createPasswordResetForUser(user);
  } else {
    logger.info("auth.password_reset.request.accepted_unknown_email");
  }

  redirect("/forgot-password?sent=1");
}

export async function resetPassword(formData: FormData) {
  const token = formString(formData, "token");
  const parsed = resetPasswordSchema.safeParse({
    token,
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword")
  });

  if (!parsed.success) {
    logger.warn("auth.password_reset.validation_failed");
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=invalid`);
  }

  const success = await completePasswordReset(parsed.data.token, parsed.data.password);
  if (!success) {
    redirect("/reset-password?error=invalid");
  }

  redirect("/login?reset=1");
}

export async function updateAccountProfile(formData: FormData) {
  const user = await requireUser();
  const parsed = accountProfileSchema.safeParse({
    username: formString(formData, "username"),
    email: formString(formData, "email")
  });

  if (!parsed.success) {
    logger.warn("account.profile.validation_failed", { userId: user.id });
    redirect("/account?profile=invalid");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: parsed.data.username }, { email: parsed.data.email }],
      NOT: { id: user.id }
    }
  });

  if (existingUser) {
    logger.warn("account.profile.duplicate", { userId: user.id });
    redirect("/account?profile=duplicate");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      username: parsed.data.username,
      email: parsed.data.email
    }
  });

  logger.info("account.profile.updated", { userId: user.id });
  redirect("/account?profile=updated");
}

export async function updateAccountPassword(formData: FormData) {
  const sessionUser = await requireUser();
  const parsed = accountPasswordSchema.safeParse({
    currentPassword: formString(formData, "currentPassword"),
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword")
  });

  if (!parsed.success) {
    logger.warn("account.password.validation_failed", { userId: sessionUser.id });
    redirect("/account?password=invalid");
  }

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) {
    logger.warn("account.password.missing_user", { userId: sessionUser.id });
    redirect("/login");
  }

  const currentPasswordMatches = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash
  );

  if (!currentPasswordMatches) {
    logger.warn("account.password.invalid_current", { userId: user.id });
    redirect("/account?password=current");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(parsed.data.password, 12)
    }
  });

  logger.info("account.password.updated", { userId: user.id });
  redirect("/account?password=updated");
}
