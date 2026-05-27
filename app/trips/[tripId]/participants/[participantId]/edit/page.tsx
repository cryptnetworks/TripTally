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
  params: { tripId: string; participantId: string };
}) {
  const user = await requireUser();
  const participant = await prisma.participant.findFirst({
    where: {
      id: params.participantId,
      trip: { id: params.tripId, ownerId: user.id }
    },
    include: { trip: true }
  });

  if (!participant) notFound();

  const action = updateParticipant.bind(null, params.tripId, participant.id);
  const removeParticipant = deleteParticipant.bind(null, params.tripId, participant.id);

  return (
    <PageShell>
      <PageHeader eyebrow={participant.trip.name} title="Edit participant" description="Update traveler details or remove them from this trip." />
      <section className="card mx-auto max-w-2xl p-5">
        <div className="mb-4 flex justify-end">
          <DeleteButton action={removeParticipant} label={`Delete ${participant.name}`} />
        </div>
        <form className="grid gap-4" action={action}>
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input className="field" id="name" name="name" defaultValue={participant.name} maxLength={120} required />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="field" id="email" name="email" type="email" defaultValue={participant.email || ""} maxLength={120} />
          </div>
          <button className="btn-primary" type="submit">Save participant</button>
        </form>
      </section>
    </PageShell>
  );
}
