import Link from "next/link";
import { LoginForm } from "@/components/AuthForm";

export default function LoginPage({
  searchParams
}: {
  searchParams: { registered?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="card w-full max-w-md p-6">
        <p className="text-xs font-bold uppercase tracking-normal text-ocean">TripTally</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Login</h1>
        <p className="mt-2 text-sm text-muted">
          Track trip costs, split expenses, and settle up clearly.
        </p>
        {searchParams.registered ? (
          <p className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-ocean">
            Account created. Login to continue.
          </p>
        ) : null}
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="mt-5 text-center text-sm text-muted">
          Need an account?{" "}
          <Link className="font-semibold text-ocean" href="/register">
            Register
          </Link>
        </p>
      </section>
    </main>
  );
}
