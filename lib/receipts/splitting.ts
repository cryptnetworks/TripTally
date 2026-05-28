import { roundCurrency } from "@/lib/calculations";

export type ReceiptSplitLineItem = {
  id: string;
  totalPrice: number;
  assignedParticipantIds: string[];
  excludedParticipantIds?: string[];
};

export function calculateReceiptItemizedShares({
  lineItems,
  participantIds,
  tax = 0,
  tip = 0
}: {
  lineItems: ReceiptSplitLineItem[];
  participantIds: string[];
  tax?: number;
  tip?: number;
}) {
  const shares = new Map(participantIds.map((participantId) => [participantId, 0]));
  const itemSubtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const serviceTotal = tax + tip;

  for (const item of lineItems) {
    const excluded = new Set(item.excludedParticipantIds || []);
    const included = item.assignedParticipantIds.filter(
      (participantId) => !excluded.has(participantId)
    );
    if (included.length === 0) continue;

    const serviceShare = itemSubtotal > 0 ? (item.totalPrice / itemSubtotal) * serviceTotal : 0;
    const itemTotal = item.totalPrice + serviceShare;
    const perParticipant = itemTotal / included.length;

    for (const participantId of included) {
      shares.set(participantId, roundCurrency((shares.get(participantId) || 0) + perParticipant));
    }
  }

  return Object.fromEntries(
    Array.from(shares.entries()).map(([participantId, value]) => [
      participantId,
      roundCurrency(value)
    ])
  );
}
