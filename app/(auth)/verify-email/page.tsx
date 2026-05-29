import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { FeedbackAlert } from "@/components/FeedbackAlert";
import { verifyEmailAddress } from "@/lib/actions";
import { queryFeedback } from "@/lib/user-messages";

export default async function VerifyEmailPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const query = await searchParams;
  const token = query.token || "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-page px-4 py-10">
      <section className="auth-card w-full max-w-md p-6">
        <div className="mb-6 flex justify-center">
          <BrandLogo href="/" priority />
        </div>
        <h1 className="text-center text-3xl font-bold text-ink">Verify your email</h1>
        <p className="mt-2 text-sm text-muted">
          Email verification is required before you can sign in to Trip Tally.
        </p>
        <FeedbackAlert className="mt-4" feedback={queryFeedback("auth", query.error)} />
        <form className="mt-6" action={verifyEmailAddress}>
          <input name="token" type="hidden" value={token} />
          <button className="btn-primary w-full" disabled={!token} type="submit">
            Verify email
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          Need a new link?{" "}
          <Link className="font-semibold text-ocean" href="/login">
            Return to login
          </Link>
        </p>
      </section>
    </main>
  );
}
