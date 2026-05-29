import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowRight, Calculator, CreditCard, Plane } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { authOptions } from "@/lib/auth";

const features = [
  {
    title: "Track every shared cost",
    description: "Log meals, stays, tickets, and transport as the trip happens.",
    icon: CreditCard
  },
  {
    title: "Split with the right people",
    description: "Choose who shared each expense and keep balances accurate.",
    icon: Calculator
  },
  {
    title: "Settle up faster",
    description: "See simple reimbursement suggestions before everyone heads home.",
    icon: Plane
  }
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-brand-page">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <BrandLogo href="/" priority />
        <div className="flex items-center gap-2">
          <Link className="btn-secondary" href="/login">
            Login
          </Link>
          <Link className="btn-primary hidden sm:inline-flex" href="/register">
            Register
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-16 pt-5 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pb-24 md:pt-12">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-normal text-ocean">
            Travel expenses, handled clearly
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-ink sm:text-5xl md:text-6xl">
            Travel together. Settle up easily.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted md:text-lg">
            SeddleUp keeps group spending, participants, balances, and settlements organized from
            the first booking to the final reimbursement.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary" href="/register">
              Start a trip <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
            <Link className="btn-secondary" href="/login">
              I already have an account
            </Link>
          </div>
        </div>

        <div className="card overflow-hidden p-4 md:p-5">
          <div
            className="rounded-lg p-4"
            style={{
              background:
                "linear-gradient(135deg, var(--app-brand-soft), var(--app-card-solid), var(--app-surface))"
            }}
          >
            <BrandLogo className="mx-auto mb-6" priority />
            <div className="grid gap-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    className="rounded-lg border border-line p-4 shadow-sm"
                    style={{ backgroundColor: "var(--app-card)" }}
                    key={feature.title}
                  >
                    <div className="flex gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-ocean">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div>
                        <h2 className="font-semibold text-ink">{feature.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-muted">{feature.description}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
