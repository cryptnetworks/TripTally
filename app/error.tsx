"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        level: "error",
        event: "app.error_boundary",
        time: new Date().toISOString(),
        message: error.message,
        digest: error.digest
      })
    );
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="card w-full max-w-md p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-normal text-coral">
          Something went wrong
        </p>
        <h1 className="mt-2 text-2xl font-bold text-ink">TripTally could not load this view.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Try again. If the problem continues, check the server logs for the error digest.
        </p>
        <button className="btn-primary mt-5 w-full" type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
