import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="card w-full max-w-md p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-normal text-ocean">Offline</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">TripTally needs a connection.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Reconnect to load your trips, expenses, and latest balances.
        </p>
        <Link className="btn-primary mt-5 w-full" href="/dashboard">
          Try dashboard
        </Link>
      </section>
    </main>
  );
}
