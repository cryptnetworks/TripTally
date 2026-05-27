import Link from "next/link";
import { notFound } from "next/navigation";
import { BalanceCard } from "@/components/BalanceCard";
import { DeleteButton } from "@/components/DeleteButton";
import { EmptyState } from "@/components/EmptyState";
import { ExpenseCard } from "@/components/ExpenseCard";
import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { SettlementList } from "@/components/SettlementList";
import { calculateBalances } from "@/lib/calculations";
import { createParticipant, deleteParticipant, deleteTrip } from "@/lib/actions";
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function TripDetailPage({ params }: { params: { tripId: string } }) {
  const user = await requireUser();
  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, ownerId: user.id },
    include: {
      participants: { orderBy: { createdAt: "asc" } },
      expenses: {
        orderBy: { date: "desc" },
        include: {
          payer: true,
          shares: { include: { participant: true } }
        }
      }
    }
  });

  if (!trip) notFound();

  const { balances, settlements } = calculateBalances(trip.participants, trip.expenses);
  const totalCost = trip.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const addParticipant = createParticipant.bind(null, trip.id);
  const removeTrip = deleteTrip.bind(null, trip.id);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Trip summary"
        title={trip.name}
        description={`${trip.destination || "Destination pending"} - ${formatDate(trip.startDate)} to ${formatDate(trip.endDate)}`}
      />

      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <Link className="btn-primary" href={`/trips/${trip.id}/expenses/new`}>Add Expense</Link>
        <Link className="btn-secondary" href={`/trips/${trip.id}/edit`}>Edit Trip</Link>
        <form action={removeTrip}>
          <button className="btn-danger w-full sm:w-auto" type="submit">Delete Trip</button>
        </form>
      </div>

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-4">
          <p className="text-sm text-muted">Total cost</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(totalCost)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted">Participants</p>
          <p className="mt-1 text-2xl font-bold">{trip.participants.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted">Expenses</p>
          <p className="mt-1 text-2xl font-bold">{trip.expenses.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted">Balances</p>
          <p className="mt-1 text-2xl font-bold">{balances.length}</p>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.9fr]">
        <div className="grid gap-5">
          <section className="card p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink">Participants</h2>
              <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
                {trip.participants.length} total
              </span>
            </div>
            <form className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" action={addParticipant}>
              <input className="field" name="name" placeholder="Name" maxLength={120} required />
              <input className="field" name="email" placeholder="Email optional" type="email" maxLength={120} />
              <button className="btn-primary" type="submit">Add</button>
            </form>
            {trip.participants.length === 0 ? (
              <p className="text-sm text-muted">Add travelers before recording expenses.</p>
            ) : (
              <div className="grid gap-3">
                {trip.participants.map((participant) => {
                  const removeParticipant = deleteParticipant.bind(null, trip.id, participant.id);
                  return (
                    <div key={participant.id} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{participant.name}</p>
                        <p className="truncate text-sm text-muted">{participant.email || "No email provided"}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Link className="btn-secondary min-h-9 px-3 py-1.5" href={`/trips/${trip.id}/participants/${participant.id}/edit`}>
                          Edit
                        </Link>
                        <DeleteButton action={removeParticipant} label={`Delete ${participant.name}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="card p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink">Expense history</h2>
              <Link className="text-sm font-semibold text-ocean" href={`/trips/${trip.id}/expenses/new`}>
                Add expense
              </Link>
            </div>
            {trip.expenses.length === 0 ? (
              <EmptyState
                title="No expenses yet"
                description="Add an expense after you have at least one participant."
                actionLabel="Add expense"
                actionHref={`/trips/${trip.id}/expenses/new`}
              />
            ) : (
              <div className="grid gap-3">
                {trip.expenses.map((expense) => (
                  <ExpenseCard key={expense.id} expense={expense} tripId={trip.id} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="grid content-start gap-5">
          <section className="card p-4">
            <h2 className="mb-4 text-lg font-semibold text-ink">Balances</h2>
            {balances.length === 0 ? (
              <p className="text-sm text-muted">Add participants and expenses to calculate balances.</p>
            ) : (
              <div className="grid gap-3">
                {balances.map((balance) => (
                  <BalanceCard key={balance.participant.id} balance={balance} />
                ))}
              </div>
            )}
          </section>
          <section className="card p-4">
            <h2 className="mb-4 text-lg font-semibold text-ink">Settlement suggestions</h2>
            <SettlementList settlements={settlements} />
          </section>
        </aside>
      </div>
    </PageShell>
  );
}
