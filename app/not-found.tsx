import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="card w-full max-w-md p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-normal text-ocean">Not found</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">This page is not available.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          The trip, expense, or page may have been deleted or you may not have access.
        </p>
        <Link className="btn-primary mt-5 w-full" href="/dashboard">
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
