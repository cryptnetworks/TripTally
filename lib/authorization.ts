import { notFound, redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export type UserRole = "owner" | "admin" | "user" | "readonly";

export function isAdminRole(role?: string | null) {
  return role === "owner" || role === "admin";
}

export function canAccessAdmin(role?: string | null) {
  return isAdminRole(role);
}

export const canManageUsers = canAccessAdmin;
export const canManageAuth = canAccessAdmin;
export const canManageSettings = canAccessAdmin;

export async function currentUserWithRole() {
  const sessionUser = await requireUser();
  return prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      disabledAt: true
    }
  });
}

export async function requireAdmin() {
  const user = await currentUserWithRole();

  if (user.disabledAt || !canAccessAdmin(user.role)) {
    logger.warn("admin.access.denied", { userId: user.id });
    notFound();
  }

  return user;
}

export async function requireAdminAction() {
  const user = await currentUserWithRole();

  if (user.disabledAt || !canAccessAdmin(user.role)) {
    logger.warn("admin.action.denied", { userId: user.id });
    redirect("/dashboard?error=forbidden");
  }

  return user;
}

export async function countActiveAdmins(excludeUserId?: string) {
  return prisma.user.count({
    where: {
      role: { in: ["owner", "admin"] },
      disabledAt: null,
      id: excludeUserId ? { not: excludeUserId } : undefined
    }
  });
}
