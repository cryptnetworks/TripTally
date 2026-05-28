"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserId } from "@/lib/actions/session";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { formString, idSchema, parseDateInput, tripSchema } from "@/lib/validation";

export async function createTrip(formData: FormData) {
  const userId = await requireCurrentUserId();
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
  const userId = await requireCurrentUserId();
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
  const userId = await requireCurrentUserId();
  const parsedTripId = idSchema.safeParse(tripId);
  if (!parsedTripId.success) redirect("/dashboard");

  await prisma.trip.deleteMany({ where: { id: tripId, ownerId: userId } });
  logger.info("trip.delete.success", { userId, tripId });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
