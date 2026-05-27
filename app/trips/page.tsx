import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { TripCard } from "@/components/TripCard";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function TripsPage() {
  const user = await requireUser();
  const trips = await prisma.trip.findMany({
    where: { ownerId: user.id },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    include: { participants: true, expenses: true }
  });

  return (
    <PageShell>
      <PageHeader
        eyebrow="Trips"
        title="Your trips"
        description="Open a trip to add participants, record shared costs, and review who owes whom."
        action={{ label: "Create Trip", href: "/trips/new" }}
      />
      {trips.length === 0 ? (
        <EmptyState
          title="No trips yet"
          description="Start with a destination and dates, then add travelers and expenses."
          actionLabel="Create trip"
          actionHref="/trips/new"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
