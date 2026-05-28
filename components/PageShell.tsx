import Link from "next/link";
import { getServerSession } from "next-auth";
import { AccountMenu } from "@/components/AccountMenu";
import { BrandLogo } from "@/components/BrandLogo";
import { MobileNav } from "@/components/MobileNav";
import { authOptions } from "@/lib/auth";

export async function PageShell({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-brand-page pb-24 md:pb-0">
      <header
        className="sticky top-0 z-10 border-b border-line px-4 py-3 backdrop-blur md:px-6"
        style={{ backgroundColor: "var(--app-card)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <BrandLogo href="/dashboard" priority />
          <nav className="hidden items-center gap-2 md:flex" aria-label="Primary">
            <Link className="btn-secondary" href="/dashboard">
              Dashboard
            </Link>
            <Link className="btn-secondary" href="/trips">
              Trips
            </Link>
            <Link className="btn-primary" href="/trips/new">
              New trip
            </Link>
            <AccountMenu name={session?.user?.name} email={session?.user?.email} />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 md:py-8">{children}</main>
      <MobileNav />
    </div>
  );
}
