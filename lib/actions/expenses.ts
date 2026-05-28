"use server";

import type { Participant } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserId } from "@/lib/actions/session";
import { calculateEqualShares } from "@/lib/calculations";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { expenseSchema, formString, idSchema, parseDateInput } from "@/lib/validation";

function parseExpenseForm(formData: FormData) {
  return expenseSchema.safeParse({
    title: formString(formData, "title"),
    amount: formString(formData, "amount"),
    category: formString(formData, "category"),
    payerId: formString(formData, "payerId"),
    date: formString(formData, "date"),
    notes: formString(formData, "notes"),
    sharedParticipantIds: formData.getAll("sharedParticipantIds").map(String)
  });
}

function selectedExpenseParticipants(
  participants: Participant[],
  sharedParticipantIds: string[],
  fallbackToAll: boolean
) {
  const selectedIds =
    fallbackToAll && sharedParticipantIds.length === 0
      ? participants.map((participant) => participant.id)
      : sharedParticipantIds;

  return participants.filter((participant) => selectedIds.includes(participant.id));
}

export async function createExpense(tripId: string, formData: FormData) {
  const userId = await requireCurrentUserId();
  const parsedTripId = idSchema.safeParse(tripId);
  if (!parsedTripId.success) redirect("/dashboard");

  const parsed = parseExpenseForm(formData);
  if (!parsed.success) {
    logger.warn("expense.create.validation_failed", { userId, tripId });
    redirect(`/trips/${tripId}/expenses/new?error=invalid`);
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, ownerId: userId },
    include: { participants: true }
  });
  if (!trip) redirect("/dashboard");

  const selectedParticipants = selectedExpenseParticipants(
    trip.participants,
    parsed.data.sharedParticipantIds,
    true
  );

  if (
    !trip.participants.some((participant) => participant.id === parsed.data.payerId) ||
    selectedParticipants.length === 0
  ) {
    logger.warn("expense.create.participants_invalid", { userId, tripId });
    redirect(`/trips/${tripId}/expenses/new?error=participants`);
  }

  const shares = calculateEqualShares(parsed.data.amount, selectedParticipants.length);

  await prisma.expense.create({
    data: {
      title: parsed.data.title,
      amount: parsed.data.amount,
      category: parsed.data.category,
      payerId: parsed.data.payerId,
      tripId,
      date: parseDateInput(parsed.data.date) ?? new Date(),
      notes: parsed.data.notes || null,
      shares: {
        create: selectedParticipants.map((participant, index) => ({
          participantId: participant.id,
          shareAmount: shares[index]
        }))
      }
    }
  });

  logger.info("expense.create.success", { userId, tripId });
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function updateExpense(tripId: string, expenseId: string, formData: FormData) {
  const userId = await requireCurrentUserId();
  const parsedTripId = idSchema.safeParse(tripId);
  const parsedExpenseId = idSchema.safeParse(expenseId);
  if (!parsedTripId.success || !parsedExpenseId.success) redirect("/dashboard");

  const parsed = parseExpenseForm(formData);
  if (!parsed.success) {
    logger.warn("expense.update.validation_failed", { userId, tripId, expenseId });
    redirect(`/trips/${tripId}/expenses/${expenseId}/edit?error=invalid`);
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, ownerId: userId },
    include: { participants: true }
  });
  if (!trip) redirect("/dashboard");

  const selectedParticipants = selectedExpenseParticipants(
    trip.participants,
    parsed.data.sharedParticipantIds,
    false
  );

  if (
    !trip.participants.some((participant) => participant.id === parsed.data.payerId) ||
    selectedParticipants.length === 0
  ) {
    logger.warn("expense.update.participants_invalid", { userId, tripId, expenseId });
    redirect(`/trips/${tripId}/expenses/${expenseId}/edit?error=participants`);
  }

  const existingExpense = await prisma.expense.findFirst({
    where: { id: expenseId, trip: { id: tripId, ownerId: userId } }
  });
  if (!existingExpense) redirect(`/trips/${tripId}`);

  const shares = calculateEqualShares(parsed.data.amount, selectedParticipants.length);

  await prisma.$transaction([
    prisma.expenseShare.deleteMany({ where: { expenseId } }),
    prisma.expense.update({
      where: { id: expenseId },
      data: {
        title: parsed.data.title,
        amount: parsed.data.amount,
        category: parsed.data.category,
        payerId: parsed.data.payerId,
        date: parseDateInput(parsed.data.date) ?? new Date(),
        notes: parsed.data.notes || null,
        shares: {
          create: selectedParticipants.map((participant, index) => ({
            participantId: participant.id,
            shareAmount: shares[index]
          }))
        }
      }
    })
  ]);

  logger.info("expense.update.success", { userId, tripId, expenseId });
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function deleteExpense(tripId: string, expenseId: string) {
  const userId = await requireCurrentUserId();
  const parsedTripId = idSchema.safeParse(tripId);
  const parsedExpenseId = idSchema.safeParse(expenseId);
  if (!parsedTripId.success || !parsedExpenseId.success) redirect("/dashboard");

  await prisma.expense.deleteMany({
    where: {
      id: expenseId,
      trip: { id: tripId, ownerId: userId }
    }
  });
  logger.info("expense.delete.success", { userId, tripId, expenseId });
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}
