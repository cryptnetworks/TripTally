import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref
}: EmptyStateProps) {
  return (
    <div className="card flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-ocean">
        TT
      </div>
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {actionLabel && actionHref ? (
        <Link className="btn-primary mt-5" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
