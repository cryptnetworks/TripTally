import Link from "next/link";
import { LoginForm } from "@/components/AuthForm";
import { BrandLogo } from "@/components/BrandLogo";
import { FeedbackAlert } from "@/components/FeedbackAlert";
import { OAuthButtons } from "@/components/OAuthButtons";
import { queryFeedback, type UserFeedback } from "@/lib/user-messages";

function loginFeedback(query: {
  registered?: string;
  reset?: string;
  logout?: string;
  verify?: string;
  verified?: string;
  verificationSent?: string;
  oauth?: string;
}) {
  const messages: UserFeedback[] = [];
  if (query.registered) {
    messages.push({
      tone: "success",
      message: "Account created. Verify your email before logging in."
    });
  }
  if (query.verify)
    messages.push({ tone: "success", message: "Check your inbox for a verification link." });
  if (query.verified) messages.push(queryFeedback("auth", "verified")!);
  if (query.verificationSent) {
    messages.push({
      tone: "success",
      message: "If that email needs verification, a new link has been sent."
    });
  }
  if (query.reset)
    messages.push({ tone: "success", message: "Password updated. Login with your new password." });
  if (query.logout) messages.push({ tone: "success", message: "You have been logged out." });
  if (query.oauth && query.oauth !== "complete") {
    messages.push(queryFeedback("auth", query.oauth) || queryFeedback("auth", "callback")!);
  }
  return messages;
}

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{
    registered?: string;
    reset?: string;
    logout?: string;
    verify?: string;
    verified?: string;
    verificationSent?: string;
    oauth?: string;
  }>;
}) {
  const query = await searchParams;
  const feedback = loginFeedback(query);

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
        {feedback.map((item) => (
          <FeedbackAlert key={`${item.tone}:${item.message}`} className="mt-4" feedback={item} />
        ))}
        <div className="mt-6">
          <LoginForm />
        </div>
        <OAuthButtons />
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
