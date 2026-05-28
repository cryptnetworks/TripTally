import { Prisma } from "@prisma/client";

export function testParticipant(id: string, name: string) {
  return {
    id,
    name,
    email: null,
    createdAt: new Date("2026-01-01T00:00:00"),
    updatedAt: new Date("2026-01-01T00:00:00"),
    tripId: "trip-1"
  };
}

export function testExpense({
  id,
  amount,
  payerId,
  shares
}: {
  id: string;
  amount: number;
  payerId: string;
  shares: Array<{ participantId: string; shareAmount: number }>;
}) {
  return {
    id,
    title: id,
    amount: new Prisma.Decimal(amount),
    category: "Food",
    date: new Date("2026-01-02T00:00:00"),
    notes: null,
    createdAt: new Date("2026-01-02T00:00:00"),
    updatedAt: new Date("2026-01-02T00:00:00"),
    payerId,
    tripId: "trip-1",
    shares: shares.map((share, index) => ({
      id: `${id}-share-${index}`,
      expenseId: id,
      participantId: share.participantId,
      shareAmount: new Prisma.Decimal(share.shareAmount)
    }))
  };
}
