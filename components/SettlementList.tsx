import type { Settlement } from "@/lib/calculations";

export function SettlementList({ settlements }: { settlements: Settlement[] }) {
  if (settlements.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-white p-4 text-sm text-muted">
        No settlement recommendations yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {settlements.map((settlement) => (
        <div
          key={`${settlement.debtorId}-${settlement.creditorId}-${settlement.amount}`}
          className="rounded-lg border border-line bg-white p-4 text-sm font-medium text-ink"
        >
          {settlement.label}
        </div>
      ))}
    </div>
  );
}
