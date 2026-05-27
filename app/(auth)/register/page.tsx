import Link from "next/link";
import { registerUser } from "@/lib/actions";

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  const errorMessage =
    query.error === "exists"
      ? "A user with that username or email already exists."
      : query.error
        ? "Check the form and try again."
        : "";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="card w-full max-w-md p-6">
        <p className="text-xs font-bold uppercase tracking-normal text-ocean">TripTally</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Register</h1>
        <p className="mt-2 text-sm text-muted">
          Create an account to keep your trips private and synced.
        </p>
        {errorMessage ? (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-coral">{errorMessage}</p>
        ) : null}
        <form className="mt-6 grid gap-4" action={registerUser}>
          <div>
            <label className="label" htmlFor="username">Username</label>
            <input className="field" id="username" name="username" minLength={3} maxLength={80} required />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="field" id="email" name="email" type="email" maxLength={120} required />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input className="field" id="password" name="password" type="password" minLength={8} maxLength={128} required />
          </div>
          <div>
            <label className="label" htmlFor="confirmPassword">Confirm password</label>
            <input className="field" id="confirmPassword" name="confirmPassword" type="password" minLength={8} maxLength={128} required />
          </div>
          <button className="btn-primary" type="submit">Create account</button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link className="font-semibold text-ocean" href="/login">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
