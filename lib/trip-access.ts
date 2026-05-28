import { notFound, redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { isTripManager, type TripRole } from "@/lib/trip-permissions";

export type ResolvedTripAccess = {
  tripId: string;
  userId: string;
  role: TripRole;
};

export async function resolveTripAccess(tripId: string, userId: string) {
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }]
    },
    include: {
      members: {
        where: { userId },
        select: { role: true, userId: true }
      }
    }
  });

  if (!trip) return null;

  const memberRole = trip.members[0]?.role;
  const role = trip.ownerId === userId ? "owner" : memberRole || "viewer";
  return { trip, access: { tripId: trip.id, userId, role: role as TripRole } };
}

export async function requireTripAccess(tripId: string, userId: string) {
  const resolved = await resolveTripAccess(tripId, userId);
  if (!resolved) {
    logger.warn("trip.access.denied", { userId, tripId });
    notFound();
  }
  return resolved;
}

export async function requireTripManager(tripId: string, userId: string) {
  const resolved = await resolveTripAccess(tripId, userId);
  if (!resolved || !isTripManager(resolved.access.role)) {
    logger.warn("trip.manage.denied", { userId, tripId });
    redirect(`/trips/${tripId}?error=forbidden`);
  }
  return resolved;
}

export async function ensureOwnerMembership(tripId: string, userId: string) {
  await prisma.tripMember.upsert({
    where: { tripId_userId: { tripId, userId } },
    update: { role: "owner" },
    create: { tripId, userId, role: "owner" }
  });
}
