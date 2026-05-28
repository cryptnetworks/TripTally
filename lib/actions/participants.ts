"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserId } from "@/lib/actions/session";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { formString, idSchema, participantSchema } from "@/lib/validation";

export async function createParticipant(tripId: string, formData: FormData) {
  const userId = await requireCurrentUserId();
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

export async function updateParticipant(tripId: string, participantId: string, formData: FormData) {
  const userId = await requireCurrentUserId();
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
  const userId = await requireCurrentUserId();
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
