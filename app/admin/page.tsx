import { AdminShell } from "@/components/AdminShell";
import { AdminStatCard } from "@/components/AdminStatCard";
import { PageHeader } from "@/components/PageHeader";
import { requireAdmin } from "@/lib/authorization";
import { listAuthProviders } from "@/lib/oauth-providers";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [users, activeUsers, disabledUsers, trips, expenses, providers, auditLogs] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { disabledAt: null } }),
      prisma.user.count({ where: { disabledAt: { not: null } } }),
      prisma.trip.count(),
      prisma.expense.count(),
      listAuthProviders(),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { actor: { select: { email: true } } }
      })
    ]);

  const enabledProviders = providers.filter((provider) => provider.enabled).length;

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Admin"
        title="Overview"
        description="Monitor account activity, authentication status, and core application health."
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total users" value={users} description={`${activeUsers} active`} />
        <AdminStatCard label="Disabled users" value={disabledUsers} />
        <AdminStatCard label="Trips" value={trips} />
        <AdminStatCard label="Expenses" value={expenses} />
        <AdminStatCard label="Enabled SSO providers" value={enabledProviders} />
        <AdminStatCard
          label="Database"
          value="Ready"
          description="Prisma connectivity is healthy."
        />
        <AdminStatCard label="Local auth" value="Configured" description="Managed in settings." />
        <AdminStatCard
          label="Audit log"
          value={auditLogs.length}
          description="Recent events loaded."
        />
      </section>

      <section className="card mt-5 p-5">
        <h2 className="text-xl font-semibold text-ink">Recent audit events</h2>
        <div className="mt-4 grid gap-3">
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted">No audit events yet.</p>
          ) : (
            auditLogs.map((event) => (
              <div
                key={event.id}
                className="rounded-lg border border-line bg-surface p-3 text-sm text-muted"
              >
                <p className="font-semibold text-ink">{event.action}</p>
                <p>
                  {event.actor?.email || "System"} · {event.createdAt.toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </AdminShell>
  );
}
