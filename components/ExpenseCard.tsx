import type { Expense, Participant } from "@prisma/client";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";

type ExpenseCardProps = {
  expense: Expense & {
    payer: Participant;
    createdBy?: { username: string; email: string } | null;
    shares: { participant: Participant; shareAmount: unknown }[];
  };
  tripId: string;
  canEdit?: boolean;
};

export function ExpenseCard({ expense, tripId, canEdit = true }: ExpenseCardProps) {
  return (
    <article className="card p-4" data-testid="expense-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-ink">{expense.title}</h3>
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted">
              {expense.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {expense.category} - {formatDate(expense.date)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-bold text-ink">{formatCurrency(Number(expense.amount))}</p>
          <p className="text-xs text-muted">Paid by {expense.payer.name}</p>
        </div>
      </div>
      {expense.notes ? <p className="mt-3 text-sm leading-6 text-muted">{expense.notes}</p> : null}
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Uploaded by {expense.createdBy?.username || "Unknown"} - shared by {expense.shares.length}{" "}
          participant{expense.shares.length === 1 ? "" : "s"}
        </p>
        {canEdit ? (
          <Link
            href={`/trips/${tripId}/expenses/${expense.id}/edit`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:text-ocean"
            aria-label={`Edit ${expense.title}`}
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>
    </article>
  );
}
