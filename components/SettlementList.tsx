import type { Settlement } from "@/lib/calculations";

export function SettlementList({ settlements }: { settlements: Settlement[] }) {
  if (settlements.length === 0) {
    return (
      <div className="card p-4 text-sm text-muted" data-testid="settlement-empty">
        No settlement recommendations yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {settlements.map((settlement) => (
        <div
          key={`${settlement.debtorId}-${settlement.creditorId}-${settlement.amount}`}
          className="card p-4 text-sm font-medium text-ink"
          data-testid="settlement-card"
        >
          {settlement.label}
        </div>
      ))}
    </div>
  );
}
