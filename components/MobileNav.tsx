"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Home, LogOut, PlusCircle, Route } from "lucide-react";

export function MobileNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-soft backdrop-blur md:hidden"
      data-testid="mobile-bottom-nav"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        <Link
          className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-muted"
          data-testid="mobile-nav-dashboard"
          href="/dashboard"
        >
          <Home className="h-5 w-5" aria-hidden />
          Home
        </Link>
        <Link
          className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-muted"
          data-testid="mobile-nav-trips"
          href="/trips"
        >
          <Route className="h-5 w-5" aria-hidden />
          Trips
        </Link>
        <Link
          className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-ocean"
          data-testid="mobile-nav-new-trip"
          href="/trips/new"
        >
          <PlusCircle className="h-5 w-5" aria-hidden />
          New
        </Link>
        <button
          className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-muted"
          data-testid="mobile-nav-logout"
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-5 w-5" aria-hidden />
          Logout
        </button>
      </div>
    </nav>
  );
}
