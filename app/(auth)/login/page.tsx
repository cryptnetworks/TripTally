import Link from "next/link";
import { LoginForm } from "@/components/AuthForm";
import { BrandLogo } from "@/components/BrandLogo";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ registered?: string; reset?: string; logout?: string }>;
}) {
  const query = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-page px-4 py-10">
      <section className="auth-card w-full max-w-md p-6">
        <div className="mb-6 flex justify-center">
          <BrandLogo href="/" priority />
        </div>
        <h1 className="text-center text-3xl font-bold text-ink">Login</h1>
        <p className="mt-2 text-sm text-muted">
          Track trip costs, split expenses, and settle up clearly.
        </p>
        {query.registered ? (
          <p className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-ocean">
            Account created. Login to continue.
          </p>
        ) : null}
        {query.reset ? (
          <p className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-ocean">
            Password updated. Login with your new password.
          </p>
        ) : null}
        {query.logout ? (
          <p className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-ocean">
            You have been logged out.
          </p>
        ) : null}
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-sm">
          <Link className="font-semibold text-ocean" href="/forgot-password">
            Forgot password?
          </Link>
        </p>
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
