"use server";

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserId } from "@/lib/actions/session";
import { writeAuditLog } from "@/lib/audit";
import { getAppConfig } from "@/lib/config";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { defaultReceiptParser } from "@/lib/receipts/parser";
import {
  safeOriginalFilename,
  storeReceiptFile,
  validateReceiptFile
} from "@/lib/receipts/storage";
import { requireTripAccess } from "@/lib/trip-access";
import { canCreateTripExpense, canEditExpense, isTripManager } from "@/lib/trip-permissions";
import { formString, idSchema, parseDateInput } from "@/lib/validation";

function nullableDecimal(value: string) {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? new Prisma.Decimal(number) : null;
}

export async function uploadReceipt(tripId: string, formData: FormData) {
  if (!getAppConfig().receiptUploadEnabled) redirect(`/trips/${tripId}?error=receipts_disabled`);

  const userId = await requireCurrentUserId();
  const parsedTripId = idSchema.safeParse(tripId);
  if (!parsedTripId.success) redirect("/dashboard");

  const resolved = await requireTripAccess(tripId, userId);
  if (!canCreateTripExpense(resolved.access.role)) redirect(`/trips/${tripId}?error=forbidden`);

  const file = formData.get("receiptFile");
  if (!(file instanceof File)) redirect(`/trips/${tripId}/receipts/new?error=file`);
  const validation = validateReceiptFile(file);
  if (!validation.ok) redirect(`/trips/${tripId}/receipts/new?error=${validation.error}`);

  const expenseId = formString(formData, "expenseId") || null;
  if (expenseId) {
    const expense = await prisma.expense.findFirst({ where: { id: expenseId, tripId } });
    if (!expense) redirect(`/trips/${tripId}/receipts/new?error=expense`);
    if (!canEditExpense(resolved.access.role, userId, expense)) {
      redirect(`/trips/${tripId}/receipts/new?error=forbidden`);
    }
  }

  const receiptId = randomUUID();
  const stored = await storeReceiptFile({
    tripId,
    receiptId,
    file,
    extension: validation.extension
  });
  const buffer = await readFile(stored.storedPath);
  const parsed = await defaultReceiptParser.parse({
    buffer,
    mimeType: file.type,
    filename: file.name
  });

  const participants = await prisma.participant.findMany({
    where: { tripId },
    select: { id: true }
  });
  const receipt = await prisma.receipt.create({
    data: {
      id: receiptId,
      tripId,
      expenseId,
      uploaderUserId: userId,
      originalFilename: safeOriginalFilename(file.name),
      storedFilename: stored.storedFilename,
      storedPath: stored.storedPath,
      mimeType: file.type,
      fileSize: file.size,
      merchant: parsed.merchant || null,
      receiptDate: parsed.receiptDate || null,
      subtotal: parsed.subtotal === undefined ? null : new Prisma.Decimal(parsed.subtotal),
      tax: parsed.tax === undefined ? null : new Prisma.Decimal(parsed.tax),
      tip: parsed.tip === undefined ? null : new Prisma.Decimal(parsed.tip),
      total: parsed.total === undefined ? null : new Prisma.Decimal(parsed.total),
      parserProvider: parsed.provider,
      parserConfidence: parsed.confidence,
      rawText: parsed.rawText || null,
      parsedJson: JSON.stringify(parsed),
      status: "needs_review",
      lineItems: {
        create: parsed.lineItems.map((item) => ({
          name: item.name,
          quantity: new Prisma.Decimal(item.quantity),
          unitPrice: item.unitPrice === undefined ? null : new Prisma.Decimal(item.unitPrice),
          totalPrice: new Prisma.Decimal(item.totalPrice),
          participants: {
            create: participants.map((participant) => ({
              participantId: participant.id,
              role: "assigned"
            }))
          }
        }))
      }
    }
  });

  await writeAuditLog({
    actorUserId: userId,
    tripId,
    action: "receipt.upload",
    targetType: "receipt",
    targetId: receipt.id,
    after: {
      originalFilename: receipt.originalFilename,
      mimeType: receipt.mimeType,
      fileSize: receipt.fileSize
    }
  });
  logger.info("receipt.upload.success", { userId, tripId, receiptId: receipt.id });
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}/receipts/${receipt.id}`);
}

export async function saveReceiptReview(tripId: string, receiptId: string, formData: FormData) {
  if (!getAppConfig().receiptUploadEnabled) redirect(`/trips/${tripId}?error=receipts_disabled`);

  const userId = await requireCurrentUserId();
  const parsedTripId = idSchema.safeParse(tripId);
  const parsedReceiptId = idSchema.safeParse(receiptId);
  if (!parsedTripId.success || !parsedReceiptId.success) redirect("/dashboard");

  const resolved = await requireTripAccess(tripId, userId);
  const receipt = await prisma.receipt.findFirst({ where: { id: receiptId, tripId } });
  if (!receipt) redirect(`/trips/${tripId}`);
  if (receipt.uploaderUserId !== userId && !isTripManager(resolved.access.role)) {
    redirect(`/trips/${tripId}?error=forbidden`);
  }

  const merchant = formString(formData, "merchant") || null;
  const receiptDate = parseDateInput(formString(formData, "receiptDate"));
  const status = formString(formData, "status") === "ready" ? "ready" : "needs_review";
  const splitMode = formString(formData, "splitMode") === "itemized" ? "itemized" : "simple";

  await prisma.receipt.update({
    where: { id: receiptId },
    data: {
      merchant,
      receiptDate,
      subtotal: nullableDecimal(formString(formData, "subtotal")),
      tax: nullableDecimal(formString(formData, "tax")),
      tip: nullableDecimal(formString(formData, "tip")),
      total: nullableDecimal(formString(formData, "total")),
      status,
      splitMode
    }
  });

  await writeAuditLog({
    actorUserId: userId,
    tripId,
    action: "receipt.review",
    targetType: "receipt",
    targetId: receiptId,
    before: { status: receipt.status, splitMode: receipt.splitMode },
    after: { status, splitMode }
  });
  revalidatePath(`/trips/${tripId}/receipts/${receiptId}`);
  redirect(`/trips/${tripId}/receipts/${receiptId}?saved=1`);
}
