"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

type LogoutButtonProps = {
  variant?: "nav" | "menu" | "mobile" | "button";
};

const styles = {
  nav: "btn-secondary gap-2",
  menu: "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-ink transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-ocean",
  mobile: "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-muted",
  button: "btn-danger gap-2"
};

export function LogoutButton({ variant = "button" }: LogoutButtonProps) {
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function logout() {
    setError("");
    setIsPending(true);

    try {
      await signOut({ callbackUrl: "/login?logout=1" });
    } catch {
      setIsPending(false);
      setError("Logout failed. Try again.");
    }
  }

  return (
    <span className={variant === "mobile" ? "flex flex-col items-center" : "block"}>
      <button
        className={styles[variant]}
        data-testid={variant === "mobile" ? "mobile-nav-logout" : "logout-button"}
        type="button"
        disabled={isPending}
        onClick={logout}
      >
        <LogOut className="h-5 w-5" aria-hidden />
        {isPending ? "Logging out..." : "Logout"}
      </button>
      {error ? <span className="mt-1 block text-xs text-coral">{error}</span> : null}
    </span>
  );
}
