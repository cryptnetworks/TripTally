import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { LogoutButton } from "@/components/LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { updateAccountPassword, updateAccountProfile } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

function profileMessage(status?: string) {
  if (status === "updated") return "Account details updated.";
  if (status === "duplicate") return "That username or email is already in use.";
  if (status === "invalid") return "Check your account details and try again.";
  return "";
}

function passwordMessage(status?: string) {
  if (status === "updated") return "Password updated.";
  if (status === "current") return "Current password is incorrect.";
  if (status === "invalid") return "Use a valid password and matching confirmation.";
  return "";
}

export default async function AccountPage({
  searchParams
}: {
  searchParams: Promise<{ profile?: string; password?: string }>;
}) {
  const sessionUser = await requireUser();
  const query = await searchParams;
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: {
      username: true,
      email: true,
      createdAt: true
    }
  });
  const profileStatus = profileMessage(query.profile);
  const passwordStatus = passwordMessage(query.password);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your profile, password, display mode, and active session."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <section className="card p-5">
          <h2 className="text-xl font-semibold text-ink">Profile</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            These details are used for login and account identification.
          </p>
          {profileStatus ? (
            <p
              className={
                query.profile === "updated"
                  ? "mt-4 rounded-lg bg-brand-soft p-3 text-sm text-ocean"
                  : "mt-4 rounded-lg border border-line bg-surface p-3 text-sm text-coral"
              }
            >
              {profileStatus}
            </p>
          ) : null}
          <form className="mt-5 grid gap-4" action={updateAccountProfile}>
            <div>
              <label className="label" htmlFor="username">
                Username
              </label>
              <input
                className="field"
                data-testid="account-username"
                id="username"
                name="username"
                defaultValue={user.username}
                minLength={3}
                maxLength={80}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                className="field"
                data-testid="account-email"
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                maxLength={120}
                required
              />
            </div>
            <button className="btn-primary" data-testid="account-profile-submit" type="submit">
              Save profile
            </button>
          </form>
        </section>

        <aside className="grid gap-4">
          <section className="card p-5">
            <h2 className="text-xl font-semibold text-ink">Appearance</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Choose the display mode that works best for your device.
            </p>
            <div className="mt-5">
              <ThemeToggle />
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-xl font-semibold text-ink">Session</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Signed in as {user.email}. Account created {user.createdAt.toLocaleDateString()}.
            </p>
            <div className="mt-5">
              <LogoutButton variant="button" />
            </div>
          </section>
        </aside>

        <section className="card p-5 lg:col-span-2">
          <h2 className="text-xl font-semibold text-ink">Change password</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Enter your current password before choosing a new one.
          </p>
          {passwordStatus ? (
            <p
              className={
                query.password === "updated"
                  ? "mt-4 rounded-lg bg-brand-soft p-3 text-sm text-ocean"
                  : "mt-4 rounded-lg border border-line bg-surface p-3 text-sm text-coral"
              }
            >
              {passwordStatus}
            </p>
          ) : null}
          <form className="mt-5 grid gap-4 md:grid-cols-3" action={updateAccountPassword}>
            <div>
              <label className="label" htmlFor="currentPassword">
                Current password
              </label>
              <input
                className="field"
                data-testid="account-current-password"
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                New password
              </label>
              <input
                className="field"
                data-testid="account-new-password"
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="confirmPassword">
                Confirm password
              </label>
              <input
                className="field"
                data-testid="account-confirm-password"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />
            </div>
            <button
              className="btn-primary md:col-span-3"
              data-testid="account-password-submit"
              type="submit"
            >
              Update password
            </button>
          </form>
        </section>
      </div>
    </PageShell>
  );
}
