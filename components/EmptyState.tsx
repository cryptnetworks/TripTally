import Link from "next/link";
import Image from "next/image";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="card flex min-h-56 flex-col items-center justify-center bg-white/95 px-5 py-10 text-center transition">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-brand-soft p-2 shadow-soft">
        <Image
          src="/branding/logo-icon.png"
          alt=""
          width={512}
          height={512}
          className="h-full w-full rounded-lg object-cover"
          sizes="64px"
        />
      </div>
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {actionLabel && actionHref ? (
        <Link
          className="btn-primary mt-5"
          data-testid={actionHref === "/trips/new" ? "dashboard-create-trip" : undefined}
          href={actionHref}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
