"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { resendVerificationEmail } from "@/lib/actions";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [requiresCode, setRequiresCode] = useState<"email" | "authenticator" | null>(null);
  const [isPending, setIsPending] = useState(false);
  const oauthToken = searchParams.get("oauthToken");

  useEffect(() => {
    if (!oauthToken) return;

    let cancelled = false;
    async function finishOAuthLogin() {
      const result = await signIn("credentials", {
        email: "oauth@example.com",
        oauthLoginToken: oauthToken,
        redirect: false
      });

      if (cancelled) return;
      if (result?.error) {
        setError("OAuth sign-in could not be completed.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    }

    void finishOAuthLogin();
    return () => {
      cancelled = true;
    };
  }, [oauthToken, router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const emailValue = String(formData.get("email") || "");
    const result = await signIn("credentials", {
      email: emailValue,
      password: formData.get("password"),
      twoFactorCode: formData.get("twoFactorCode"),
      redirect: false
    });

    setIsPending(false);

    if (result?.error) {
      setEmail(emailValue);
      if (result.error === "EMAIL_VERIFICATION_REQUIRED") {
        setError("Verify your email before logging in.");
        return;
      }
      if (result.error === "EMAIL_OTP_REQUIRED") {
        setRequiresCode("email");
        setError("Enter the six-digit code sent to your email.");
        return;
      }
      if (result.error === "AUTHENTICATOR_OTP_REQUIRED") {
        setRequiresCode("authenticator");
        setError("Enter the six-digit code from your authenticator app.");
        return;
      }
      setError("Invalid email or password.");
      return;
    }

    router.push(searchParams.get("callbackUrl") || "/dashboard");
    router.refresh();
  }

  return (
    <>
      <form className="grid gap-4" data-testid="login-form" onSubmit={onSubmit}>
        {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-coral">{error}</p> : null}
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            className="field"
            data-testid="login-email"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={email}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            className="field"
            data-testid="login-password"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {requiresCode ? (
          <div>
            <label className="label" htmlFor="twoFactorCode">
              Verification code
            </label>
            <input
              className="field"
              data-testid="login-two-factor-code"
              id="twoFactorCode"
              name="twoFactorCode"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              required
            />
            <p className="mt-1 text-xs text-muted">
              {requiresCode === "email"
                ? "Use the code sent to your verified email address."
                : "Use the current code from your authenticator app."}
            </p>
          </div>
        ) : null}
        <button
          className="btn-primary"
          data-testid="login-submit"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Signing in..." : "Login"}
        </button>
      </form>
      {error === "Verify your email before logging in." ? (
        <form className="mt-3" action={resendVerificationEmail}>
          <input name="email" type="hidden" value={email} />
          <button className="btn-secondary w-full" type="submit">
            Resend verification email
          </button>
        </form>
      ) : null}
    </>
  );
}
