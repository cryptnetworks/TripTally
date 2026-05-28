import type { ParticipantWithBalances } from "@/lib/calculations";
import { formatCurrency } from "@/lib/format";

export function BalanceCard({ balance }: { balance: ParticipantWithBalances }) {
  const isPositive = balance.net >= 0;

  return (
    <article className="card p-4" data-testid="balance-card">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-ink">{balance.participant.name}</h3>
        <span
          className={
            isPositive
              ? "rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-ocean"
              : "rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-coral"
          }
        >
          {isPositive ? "Reimburse" : "Owes"}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted">
        Paid {formatCurrency(balance.paid)}, owes {formatCurrency(balance.owed)}
      </p>
      <p
        className={
          isPositive ? "mt-2 text-2xl font-bold text-ocean" : "mt-2 text-2xl font-bold text-coral"
        }
      >
        {formatCurrency(balance.net)}
      </p>
    </article>
  );
}
