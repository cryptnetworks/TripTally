import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/DeleteButton";
import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { deleteParticipant, updateParticipant } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function EditParticipantPage({
  params
}: {
  params: Promise<{ tripId: string; participantId: string }>;
}) {
  const { tripId, participantId } = await params;
  const user = await requireUser();
  const participant = await prisma.participant.findFirst({
    where: {
      id: participantId,
      trip: { id: tripId, ownerId: user.id }
    },
    include: { trip: true }
  });

  if (!participant) notFound();

  const action = updateParticipant.bind(null, tripId, participant.id);
  const removeParticipant = deleteParticipant.bind(null, tripId, participant.id);

  return (
    <PageShell>
      <PageHeader eyebrow={participant.trip.name} title="Edit participant" description="Update traveler details or remove them from this trip." />
      <section className="card mx-auto max-w-2xl p-5">
        <div className="mb-4 flex justify-end">
          <DeleteButton action={removeParticipant} label={`Delete ${participant.name}`} />
        </div>
        <form className="grid gap-4" action={action} data-testid="participant-form">
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input className="field" data-testid="participant-name" id="name" name="name" defaultValue={participant.name} maxLength={120} required />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="field" data-testid="participant-email" id="email" name="email" type="email" defaultValue={participant.email || ""} maxLength={120} />
          </div>
          <button className="btn-primary" data-testid="participant-submit" type="submit">Save participant</button>
        </form>
      </section>
    </PageShell>
  );
}
