import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { createExpense } from "@/lib/actions";
import { categories } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function NewExpensePage({ params }: { params: { tripId: string } }) {
  const user = await requireUser();
  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, ownerId: user.id },
    include: { participants: { orderBy: { createdAt: "asc" } } }
  });

  if (!trip) notFound();
  if (trip.participants.length === 0) redirect(`/trips/${trip.id}?error=no-participants`);

  const action = createExpense.bind(null, trip.id);

  return (
    <PageShell>
      <PageHeader eyebrow={trip.name} title="Add expense" description="Choose the payer and everyone who shares this cost." />
      <section className="card mx-auto max-w-2xl p-5">
        <form className="grid gap-4" action={action}>
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input className="field" id="title" name="title" maxLength={140} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="amount">Amount</label>
              <input className="field" id="amount" name="amount" type="number" min="0.01" step="0.01" required />
            </div>
            <div>
              <label className="label" htmlFor="category">Category</label>
              <select className="field" id="category" name="category" required>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="payerId">Payer</label>
              <select className="field" id="payerId" name="payerId" required>
                {trip.participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>{participant.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="date">Date</label>
              <input className="field" id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
            </div>
          </div>
          <fieldset>
            <legend className="label">Shared by</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {trip.participants.map((participant) => (
                <label key={participant.id} className="flex min-h-11 items-center gap-3 rounded-lg border border-line bg-white px-3 py-2 text-sm">
                  <input name="sharedParticipantIds" type="checkbox" value={participant.id} defaultChecked />
                  {participant.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label className="label" htmlFor="notes">Notes</label>
            <textarea className="field min-h-28" id="notes" name="notes" maxLength={500} />
          </div>
          <button className="btn-primary" type="submit">Record expense</button>
        </form>
      </section>
    </PageShell>
  );
}
