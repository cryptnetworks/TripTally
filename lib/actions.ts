"use server";

import * as bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { calculateEqualShares } from "@/lib/calculations";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  expenseSchema,
  formString,
  idSchema,
  parseDateInput,
  participantSchema,
  registerSchema,
  tripSchema
} from "@/lib/validation";

async function currentUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

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

export async function createTrip(formData: FormData) {
  const userId = await currentUserId();
  const parsed = tripSchema.safeParse({
    name: formString(formData, "name"),
    destination: formString(formData, "destination"),
    startDate: formString(formData, "startDate"),
    endDate: formString(formData, "endDate")
  });

  if (!parsed.success) {
    logger.warn("trip.create.validation_failed", { userId });
    redirect("/trips/new?error=invalid");
  }

  const trip = await prisma.trip.create({
    data: {
      name: parsed.data.name,
      destination: parsed.data.destination || null,
      startDate: parseDateInput(parsed.data.startDate),
      endDate: parseDateInput(parsed.data.endDate),
      ownerId: userId
    }
  });

  logger.info("trip.create.success", { userId, tripId: trip.id });
  revalidatePath("/dashboard");
  redirect(`/trips/${trip.id}`);
}

export async function updateTrip(tripId: string, formData: FormData) {
  const userId = await currentUserId();
  const parsedTripId = idSchema.safeParse(tripId);
  if (!parsedTripId.success) redirect("/dashboard");

  const parsed = tripSchema.safeParse({
    name: formString(formData, "name"),
    destination: formString(formData, "destination"),
    startDate: formString(formData, "startDate"),
    endDate: formString(formData, "endDate")
  });

  if (!parsed.success) {
    logger.warn("trip.update.validation_failed", { userId, tripId });
    redirect(`/trips/${tripId}/edit?error=invalid`);
  }

  await prisma.trip.updateMany({
    where: { id: tripId, ownerId: userId },
    data: {
      name: parsed.data.name,
      destination: parsed.data.destination || null,
      startDate: parseDateInput(parsed.data.startDate),
      endDate: parseDateInput(parsed.data.endDate)
    }
  });

  logger.info("trip.update.success", { userId, tripId });
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function deleteTrip(tripId: string) {
  const userId = await currentUserId();
  const parsedTripId = idSchema.safeParse(tripId);
  if (!parsedTripId.success) redirect("/dashboard");

  await prisma.trip.deleteMany({ where: { id: tripId, ownerId: userId } });
  logger.info("trip.delete.success", { userId, tripId });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function createParticipant(tripId: string, formData: FormData) {
  const userId = await currentUserId();
  const parsedTripId = idSchema.safeParse(tripId);
  if (!parsedTripId.success) redirect("/dashboard");

  const parsed = participantSchema.safeParse({
    name: formString(formData, "name"),
    email: formString(formData, "email")
  });

  if (!parsed.success) {
    logger.warn("participant.create.validation_failed", { userId, tripId });
    redirect(`/trips/${tripId}?error=participant`);
  }

  const trip = await prisma.trip.findFirst({ where: { id: tripId, ownerId: userId } });
  if (!trip) redirect("/dashboard");

  await prisma.participant.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email || null,
      tripId
    }
  });

  logger.info("participant.create.success", { userId, tripId });
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function updateParticipant(
  tripId: string,
  participantId: string,
  formData: FormData
) {
  const userId = await currentUserId();
  const parsedTripId = idSchema.safeParse(tripId);
  const parsedParticipantId = idSchema.safeParse(participantId);
  if (!parsedTripId.success || !parsedParticipantId.success) redirect("/dashboard");

  const parsed = participantSchema.safeParse({
    name: formString(formData, "name"),
    email: formString(formData, "email")
  });

  if (!parsed.success) {
    logger.warn("participant.update.validation_failed", { userId, tripId, participantId });
    redirect(`/trips/${tripId}/participants/${participantId}/edit?error=invalid`);
  }

  const participant = await prisma.participant.findFirst({
    where: { id: participantId, trip: { id: tripId, ownerId: userId } }
  });
  if (!participant) redirect(`/trips/${tripId}`);

  await prisma.participant.update({
    where: { id: participantId },
    data: {
      name: parsed.data.name,
      email: parsed.data.email || null
    }
  });

  logger.info("participant.update.success", { userId, tripId, participantId });
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function deleteParticipant(tripId: string, participantId: string) {
  const userId = await currentUserId();
  const parsedTripId = idSchema.safeParse(tripId);
  const parsedParticipantId = idSchema.safeParse(participantId);
  if (!parsedTripId.success || !parsedParticipantId.success) redirect("/dashboard");

  await prisma.participant.deleteMany({
    where: {
      id: participantId,
      trip: { id: tripId, ownerId: userId }
    }
  });
  logger.info("participant.delete.success", { userId, tripId, participantId });
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function createExpense(tripId: string, formData: FormData) {
  const userId = await currentUserId();
  const parsedTripId = idSchema.safeParse(tripId);
  if (!parsedTripId.success) redirect("/dashboard");

  const parsed = expenseSchema.safeParse({
    title: formString(formData, "title"),
    amount: formString(formData, "amount"),
    category: formString(formData, "category"),
    payerId: formString(formData, "payerId"),
    date: formString(formData, "date"),
    notes: formString(formData, "notes"),
    sharedParticipantIds: formData.getAll("sharedParticipantIds").map(String)
  });

  if (!parsed.success) {
    logger.warn("expense.create.validation_failed", { userId, tripId });
    redirect(`/trips/${tripId}/expenses/new?error=invalid`);
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, ownerId: userId },
    include: { participants: true }
  });
  if (!trip) redirect("/dashboard");

  const sharedIds = parsed.data.sharedParticipantIds;
  const selectedIds = sharedIds.length > 0 ? sharedIds : trip.participants.map((p) => p.id);
  const selectedParticipants = trip.participants.filter((p) => selectedIds.includes(p.id));

  if (
    !trip.participants.some((p) => p.id === parsed.data.payerId) ||
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

export async function updateExpense(
  tripId: string,
  expenseId: string,
  formData: FormData
) {
  const userId = await currentUserId();
  const parsedTripId = idSchema.safeParse(tripId);
  const parsedExpenseId = idSchema.safeParse(expenseId);
  if (!parsedTripId.success || !parsedExpenseId.success) redirect("/dashboard");

  const parsed = expenseSchema.safeParse({
    title: formString(formData, "title"),
    amount: formString(formData, "amount"),
    category: formString(formData, "category"),
    payerId: formString(formData, "payerId"),
    date: formString(formData, "date"),
    notes: formString(formData, "notes"),
    sharedParticipantIds: formData.getAll("sharedParticipantIds").map(String)
  });

  if (!parsed.success) {
    logger.warn("expense.update.validation_failed", { userId, tripId, expenseId });
    redirect(`/trips/${tripId}/expenses/${expenseId}/edit?error=invalid`);
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, ownerId: userId },
    include: { participants: true }
  });
  if (!trip) redirect("/dashboard");

  const selectedIds = parsed.data.sharedParticipantIds;
  const selectedParticipants = trip.participants.filter((p) => selectedIds.includes(p.id));

  if (
    !trip.participants.some((p) => p.id === parsed.data.payerId) ||
    selectedParticipants.length === 0
  ) {
    logger.warn("expense.update.participants_invalid", { userId, tripId, expenseId });
    redirect(`/trips/${tripId}/expenses/${expenseId}/edit?error=participants`);
  }

  const shares = calculateEqualShares(parsed.data.amount, selectedParticipants.length);

  const existingExpense = await prisma.expense.findFirst({
    where: { id: expenseId, trip: { id: tripId, ownerId: userId } }
  });
  if (!existingExpense) redirect(`/trips/${tripId}`);

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
  const userId = await currentUserId();
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
