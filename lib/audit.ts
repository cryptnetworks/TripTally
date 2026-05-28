import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

type AuditInput = {
  actorUserId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(input: AuditInput) {
  const requestHeaders = await headers();
  const ipAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    null;
  const userAgent = requestHeaders.get("user-agent");

  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId || null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId || null,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
      ipAddress,
      userAgent
    }
  });
}

export async function writeSystemAuditLog(input: Omit<AuditInput, "actorUserId">) {
  await prisma.auditLog.create({
    data: {
      actorUserId: null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId || null,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null
    }
  });
}
