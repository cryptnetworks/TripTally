import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions";

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const query = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="card w-full max-w-md p-6">
        <p className="text-xs font-bold uppercase tracking-normal text-ocean">TripTally</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Reset password</h1>
        <p className="mt-2 text-sm text-muted">
          Enter your email and we will send password reset instructions if an account exists.
        </p>
        {query.sent ? (
          <p className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-ocean">
            If that email is registered, a reset link has been sent.
          </p>
        ) : null}
        <form
          className="mt-6 grid gap-4"
          action={requestPasswordReset}
          data-testid="forgot-password-form"
        >
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              className="field"
              data-testid="forgot-password-email"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={120}
              required
            />
          </div>
          <button className="btn-primary" data-testid="forgot-password-submit" type="submit">
            Send reset link
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          Remembered it?{" "}
          <Link className="font-semibold text-ocean" href="/login">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
