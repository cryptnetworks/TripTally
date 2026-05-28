import { notFound, redirect } from "next/navigation";
import { ItemLookupBox } from "@/components/item-lookup/ItemLookupBox";
import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { createExpense } from "@/lib/actions";
import { categories } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { requireTripAccess } from "@/lib/trip-access";
import {
  allowedExpenseStatusesForRole,
  canCreateTripExpense,
  isTripManager
} from "@/lib/trip-permissions";

export default async function NewExpensePage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const user = await requireUser();
  const resolved = await requireTripAccess(tripId, user.id);
  if (!canCreateTripExpense(resolved.access.role)) notFound();
  const trip = await prisma.trip.findFirst({
    where: { id: tripId },
    include: { participants: { orderBy: { createdAt: "asc" } } }
  });

  if (!trip) notFound();
  if (trip.participants.length === 0) redirect(`/trips/${trip.id}?error=no-participants`);

  const action = createExpense.bind(null, trip.id);
  const payerOptions = isTripManager(resolved.access.role)
    ? trip.participants
    : trip.participants.filter((participant) => participant.userId === user.id);
  if (payerOptions.length === 0) redirect(`/trips/${trip.id}?error=participant-link-required`);
  const statusOptions = allowedExpenseStatusesForRole(resolved.access.role).filter(
    (status) => status === "draft" || status === "submitted"
  );

  return (
    <PageShell>
      <PageHeader
        eyebrow={trip.name}
        title="Add expense"
        description="Choose the payer and everyone who shares this cost."
      />
      <section className="card mx-auto max-w-2xl p-5">
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
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="status">
              Status
            </label>
            <select className="field" id="status" name="status" defaultValue="submitted">
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
                    defaultChecked
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
              maxLength={500}
            />
          </div>
          <button className="btn-primary" data-testid="expense-submit" type="submit">
            Record expense
          </button>
        </form>
      </section>
    </PageShell>
  );
}
