"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false
    });

    setIsPending(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(searchParams.get("callbackUrl") || "/dashboard");
    router.refresh();
  }

  return (
    <form className="grid gap-4" data-testid="login-form" onSubmit={onSubmit}>
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-coral">{error}</p> : null}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="field" data-testid="login-email" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="field" data-testid="login-password" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button className="btn-primary" data-testid="login-submit" disabled={isPending} type="submit">
        {isPending ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}
