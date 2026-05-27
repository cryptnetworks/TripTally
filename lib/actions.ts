"use server";

import * as bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { calculateEqualShares } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";

async function currentUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

function optionalDate(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string") return null;
  return value ? new Date(`${value}T00:00:00`) : null;
}

function requiredDate(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string") return new Date();
  return new Date(`${value}T00:00:00`);
}

const registerSchema = z
  .object({
    username: z.string().trim().min(3).max(80),
    email: z.string().trim().email().max(120),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"]
  });

export async function registerUser(formData: FormData) {
  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    redirect("/register?error=invalid");
  }

  const email = parsed.data.email.toLowerCase();
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username: parsed.data.username }]
    }
  });

  if (existingUser) {
    redirect("/register?error=exists");
  }

  await prisma.user.create({
    data: {
      username: parsed.data.username,
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12)
    }
  });

  redirect("/login?registered=1");
}

const tripSchema = z.object({
  name: z.string().trim().min(1).max(140),
  destination: z.string().trim().max(140).optional()
});

export async function createTrip(formData: FormData) {
  const userId = await currentUserId();
  const parsed = tripSchema.safeParse({
    name: formData.get("name"),
    destination: formData.get("destination") || undefined
  });

  if (!parsed.success) redirect("/trips/new?error=invalid");

  const trip = await prisma.trip.create({
    data: {
      name: parsed.data.name,
      destination: parsed.data.destination || null,
      startDate: optionalDate(formData.get("startDate")),
      endDate: optionalDate(formData.get("endDate")),
      ownerId: userId
    }
  });

  revalidatePath("/dashboard");
  redirect(`/trips/${trip.id}`);
}

export async function updateTrip(tripId: string, formData: FormData) {
  const userId = await currentUserId();
  const parsed = tripSchema.safeParse({
    name: formData.get("name"),
    destination: formData.get("destination") || undefined
  });

  if (!parsed.success) redirect(`/trips/${tripId}/edit?error=invalid`);

  await prisma.trip.updateMany({
    where: { id: tripId, ownerId: userId },
    data: {
      name: parsed.data.name,
      destination: parsed.data.destination || null,
      startDate: optionalDate(formData.get("startDate")),
      endDate: optionalDate(formData.get("endDate"))
    }
  });

  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function deleteTrip(tripId: string) {
  const userId = await currentUserId();
  await prisma.trip.deleteMany({ where: { id: tripId, ownerId: userId } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

const participantSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(120).optional().or(z.literal(""))
});

export async function createParticipant(tripId: string, formData: FormData) {
  const userId = await currentUserId();
  const parsed = participantSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") || ""
  });

  if (!parsed.success) redirect(`/trips/${tripId}?error=participant`);

  const trip = await prisma.trip.findFirst({ where: { id: tripId, ownerId: userId } });
  if (!trip) redirect("/dashboard");

  await prisma.participant.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email || null,
      tripId
    }
  });

  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function updateParticipant(
  tripId: string,
  participantId: string,
  formData: FormData
) {
  const userId = await currentUserId();
  const parsed = participantSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") || ""
  });

  if (!parsed.success) {
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

  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function deleteParticipant(tripId: string, participantId: string) {
  const userId = await currentUserId();
  await prisma.participant.deleteMany({
    where: {
      id: participantId,
      trip: { id: tripId, ownerId: userId }
    }
  });
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

const expenseSchema = z.object({
  title: z.string().trim().min(1).max(140),
  amount: z.coerce.number().positive(),
  category: z.string().trim().min(1).max(80),
  payerId: z.string().min(1),
  notes: z.string().trim().max(500).optional()
});

export async function createExpense(tripId: string, formData: FormData) {
  const userId = await currentUserId();
  const parsed = expenseSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    payerId: formData.get("payerId"),
    notes: formData.get("notes") || undefined
  });

  if (!parsed.success) redirect(`/trips/${tripId}/expenses/new?error=invalid`);

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, ownerId: userId },
    include: { participants: true }
  });
  if (!trip) redirect("/dashboard");

  const sharedIds = formData.getAll("sharedParticipantIds").map(String);
  const selectedIds = sharedIds.length > 0 ? sharedIds : trip.participants.map((p) => p.id);
  const selectedParticipants = trip.participants.filter((p) => selectedIds.includes(p.id));

  if (
    !trip.participants.some((p) => p.id === parsed.data.payerId) ||
    selectedParticipants.length === 0
  ) {
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
      date: requiredDate(formData.get("date")),
      notes: parsed.data.notes || null,
      shares: {
        create: selectedParticipants.map((participant, index) => ({
          participantId: participant.id,
          shareAmount: shares[index]
        }))
      }
    }
  });

  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function updateExpense(
  tripId: string,
  expenseId: string,
  formData: FormData
) {
  const userId = await currentUserId();
  const parsed = expenseSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    payerId: formData.get("payerId"),
    notes: formData.get("notes") || undefined
  });

  if (!parsed.success) redirect(`/trips/${tripId}/expenses/${expenseId}/edit?error=invalid`);

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, ownerId: userId },
    include: { participants: true }
  });
  if (!trip) redirect("/dashboard");

  const selectedIds = formData.getAll("sharedParticipantIds").map(String);
  const selectedParticipants = trip.participants.filter((p) => selectedIds.includes(p.id));

  if (
    !trip.participants.some((p) => p.id === parsed.data.payerId) ||
    selectedParticipants.length === 0
  ) {
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
        date: requiredDate(formData.get("date")),
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

  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function deleteExpense(tripId: string, expenseId: string) {
  const userId = await currentUserId();
  await prisma.expense.deleteMany({
    where: {
      id: expenseId,
      trip: { id: tripId, ownerId: userId }
    }
  });
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}
