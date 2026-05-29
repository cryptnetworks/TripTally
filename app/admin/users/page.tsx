import { AdminShell } from "@/components/AdminShell";
import { FeedbackAlert } from "@/components/FeedbackAlert";
import { PageHeader } from "@/components/PageHeader";
import { deleteUser, resetUserPassword, setUserDisabled, updateUserRole } from "@/lib/actions";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { queryFeedback } from "@/lib/user-messages";

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    status?: string;
    page?: string;
    error?: string;
  }>;
}) {
  await requireAdmin();
  const query = await searchParams;
  const page = Math.max(1, Number(query.page || "1"));
  const pageSize = 20;
  const where = {
    role: query.role && query.role !== "all" ? query.role : undefined,
    disabledAt:
      query.status === "disabled" ? { not: null } : query.status === "active" ? null : undefined,
    OR: query.q
      ? [{ email: { contains: query.q } }, { username: { contains: query.q } }]
      : undefined
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { authAccounts: true }
    }),
    prisma.user.count({ where })
  ]);

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Admin"
        title="Users"
        description="Manage user roles, status, local passwords, and linked authentication providers."
      />
      <FeedbackAlert className="mb-4" feedback={queryFeedback("admin", query.error)} />
      <form className="card mb-4 grid gap-3 p-4 md:grid-cols-4">
        <input className="field" name="q" placeholder="Search users" defaultValue={query.q || ""} />
        <select className="field" name="role" defaultValue={query.role || "all"}>
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="readonly">Readonly</option>
        </select>
        <select className="field" name="status" defaultValue={query.status || "all"}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
        <button className="btn-primary" type="submit">
          Filter
        </button>
      </form>

      <div className="grid gap-3">
        {users.map((user) => (
          <article key={user.id} className="card p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="font-semibold text-ink">{user.email}</h2>
                <p className="text-sm text-muted">
                  {user.username} · {user.role} · {user.disabledAt ? "Disabled" : "Active"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Created {user.createdAt.toLocaleDateString()} · Last login{" "}
                  {user.lastLoginAt?.toLocaleString() || "Never"} · Providers{" "}
                  {user.authAccounts.map((account) => account.providerId).join(", ") || "local"}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[520px]">
                <form className="flex gap-2" action={updateUserRole}>
                  <input name="userId" type="hidden" value={user.id} />
                  <select
                    className="field min-h-11 py-2 text-sm"
                    name="role"
                    defaultValue={user.role}
                  >
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                    <option value="readonly">Readonly</option>
                  </select>
                  <button className="btn-secondary" type="submit">
                    Save
                  </button>
                </form>
                <form action={setUserDisabled}>
                  <input name="userId" type="hidden" value={user.id} />
                  <input name="disabled" type="hidden" value={user.disabledAt ? "false" : "true"} />
                  <button className="btn-secondary w-full" type="submit">
                    {user.disabledAt ? "Enable" : "Disable"}
                  </button>
                </form>
                <form className="flex gap-2" action={resetUserPassword}>
                  <input name="userId" type="hidden" value={user.id} />
                  <input
                    className="field min-h-11 py-2 text-sm"
                    name="password"
                    type="password"
                    placeholder="New password"
                    minLength={8}
                    required
                  />
                  <button className="btn-secondary" type="submit">
                    Reset
                  </button>
                </form>
                <form action={deleteUser}>
                  <input name="userId" type="hidden" value={user.id} />
                  <button className="btn-danger w-full" type="submit">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">
        Showing {users.length} of {total} users.
      </p>
    </AdminShell>
  );
}
