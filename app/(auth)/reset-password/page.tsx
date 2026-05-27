import Link from "next/link";
import { resetPassword } from "@/lib/actions";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const query = await searchParams;
  const token = query.token || "";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="card w-full max-w-md p-6">
        <p className="text-xs font-bold uppercase tracking-normal text-ocean">TripTally</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Choose a new password</h1>
        <p className="mt-2 text-sm text-muted">
          Use at least 8 characters. Reset links can only be used once.
        </p>
        {query.error ? (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-coral">
            This reset link is invalid or expired. Request a new link.
          </p>
        ) : null}
        <form className="mt-6 grid gap-4" action={resetPassword} data-testid="reset-password-form">
          <input data-testid="reset-password-token" name="token" type="hidden" value={token} />
          <div>
            <label className="label" htmlFor="password">New password</label>
            <input className="field" data-testid="reset-password-new" id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
          </div>
          <div>
            <label className="label" htmlFor="confirmPassword">Confirm password</label>
            <input className="field" data-testid="reset-password-confirm" id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
          </div>
          <button className="btn-primary" data-testid="reset-password-submit" disabled={!token} type="submit">Update password</button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          Need a new link?{" "}
          <Link className="font-semibold text-ocean" href="/forgot-password">
            Request reset
          </Link>
        </p>
      </section>
    </main>
  );
}
