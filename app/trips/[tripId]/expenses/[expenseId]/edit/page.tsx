import { notFound } from "next/navigation";
import { FeedbackAlert } from "@/components/FeedbackAlert";
import { ItemLookupBox } from "@/components/item-lookup/ItemLookupBox";
import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteExpense, updateExpense } from "@/lib/actions";
import { categories, dateInputValue } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { requireTripAccess } from "@/lib/trip-access";
import {
  allowedExpenseStatusesForRole,
  canEditExpense,
  isTripManager
} from "@/lib/trip-permissions";
import { queryFeedback } from "@/lib/user-messages";

export default async function EditExpensePage({
  params,
  searchParams
}: {
  params: Promise<{ tripId: string; expenseId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { tripId, expenseId } = await params;
  const query = await searchParams;
  const user = await requireUser();
  const resolved = await requireTripAccess(tripId, user.id);
  const trip = await prisma.trip.findFirst({
    where: { id: tripId },
    include: {
      participants: { orderBy: { createdAt: "asc" } },
      expenses: {
        where: { id: expenseId },
        include: { shares: true }
      }
    }
  });

  if (!trip || trip.expenses.length === 0) notFound();

  const expense = trip.expenses[0];
  if (!canEditExpense(resolved.access.role, user.id, expense)) notFound();
  const sharedIds = new Set(expense.shares.map((share) => share.participantId));
  const action = updateExpense.bind(null, trip.id, expense.id);
  const removeExpense = deleteExpense.bind(null, trip.id, expense.id);
  const payerOptions = isTripManager(resolved.access.role)
    ? trip.participants
    : trip.participants.filter((participant) => participant.userId === user.id);
  const statusOptions = allowedExpenseStatusesForRole(resolved.access.role);

  return (
    <PageShell>
      <PageHeader
        eyebrow={trip.name}
        title="Edit expense"
        description="Update the cost details or remove this expense."
      />
      <section className="card mx-auto max-w-2xl p-5">
        <FeedbackAlert className="mb-4" feedback={queryFeedback("expense", query.error)} />
        <div className="mb-4 flex justify-end">
          <DeleteButton action={removeExpense} label={`Delete ${expense.title}`} />
        </div>
        <form className="grid gap-4" action={action} data-testid="expense-form">
          <ItemLookupBox />
          <div>
            <label className="label" htmlFor="title">
              Title
            </label>
            <input
              className="field"
              data-testid="expense-title"
              id="title"
              name="title"
              defaultValue={expense.title}
              maxLength={140}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="amount">
                Amount
              </label>
              <input
                className="field"
                data-testid="expense-amount"
                id="amount"
                name="amount"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                min="0.01"
                step="0.01"
                defaultValue={Number(expense.amount).toFixed(2)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="category">
                Category
              </label>
              <select
                className="field"
                data-testid="expense-category"
                id="category"
                name="category"
                defaultValue={expense.category}
                required
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="payerId">
                Payer
              </label>
              <select
                className="field"
                data-testid="expense-payer"
                id="payerId"
                name="payerId"
                defaultValue={expense.payerId}
                required
              >
                {payerOptions.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="date">
                Date
              </label>
              <input
                className="field"
                data-testid="expense-date"
                id="date"
                name="date"
                type="date"
                defaultValue={dateInputValue(expense.date)}
                required
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="status">
              Status
            </label>
            <select className="field" id="status" name="status" defaultValue={expense.status}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <fieldset>
            <legend className="label">Shared by</legend>
            <div className="grid gap-2 sm:grid-cols-2" data-testid="expense-shares">
              {trip.participants.map((participant) => (
                <label
                  key={participant.id}
                  className="flex min-h-11 items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                >
                  <input
                    data-testid="expense-share-checkbox"
                    name="sharedParticipantIds"
                    type="checkbox"
                    value={participant.id}
                    defaultChecked={sharedIds.has(participant.id)}
                  />
                  {participant.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label className="label" htmlFor="notes">
              Notes
            </label>
            <textarea
              className="field min-h-28"
              data-testid="expense-notes"
              id="notes"
              name="notes"
              defaultValue={expense.notes || ""}
              maxLength={500}
            />
          </div>
          <button className="btn-primary" data-testid="expense-submit" type="submit">
            Save expense
          </button>
        </form>
      </section>
    </PageShell>
  );
}
