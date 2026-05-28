import { AdminShell } from "@/components/AdminShell";
import { PageHeader } from "@/components/PageHeader";
import { updateAuthProviderConfig } from "@/lib/actions";
import { requireAdmin } from "@/lib/authorization";
import { listAuthProviders, oauthCallbackUrl } from "@/lib/oauth-providers";

export default async function AdminAuthPage() {
  await requireAdmin();
  const providers = await listAuthProviders();

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Admin"
        title="Authentication"
        description="Configure OAuth and SSO providers. Secrets are encrypted and never displayed."
      />
      <div className="grid gap-4">
        {providers.map((provider) => (
          <section key={provider.id} className="card p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-ink">{provider.name}</h2>
                <p className="text-sm text-muted">
                  {provider.enabled ? "Enabled" : "Disabled"} · Secret{" "}
                  {provider.hasSecret ? "configured" : "missing"}
                </p>
              </div>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-ocean">
                {provider.id}
              </span>
            </div>
            <form className="mt-5 grid gap-4" action={updateAuthProviderConfig}>
              <input name="providerId" type="hidden" value={provider.id} />
              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink">
                <input name="enabled" type="checkbox" defaultChecked={provider.enabled} />
                Enable provider
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label" htmlFor={`${provider.id}-clientId`}>
                    Client ID
                  </label>
                  <input
                    className="field"
                    id={`${provider.id}-clientId`}
                    name="clientId"
                    defaultValue={provider.clientId || ""}
                  />
                </div>
                <div>
                  <label className="label" htmlFor={`${provider.id}-clientSecret`}>
                    Client secret replacement
                  </label>
                  <input
                    className="field"
                    id={`${provider.id}-clientSecret`}
                    name="clientSecret"
                    type="password"
                    placeholder={
                      provider.hasSecret ? "Configured - enter to replace" : "Not configured"
                    }
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor={`${provider.id}-scopes`}>
                  Scopes
                </label>
                <input
                  className="field"
                  id={`${provider.id}-scopes`}
                  name="scopes"
                  defaultValue={provider.scopes.join(" ")}
                />
              </div>
              <div>
                <p className="label">Callback URL</p>
                <code className="block break-all rounded-lg border border-line bg-surface p-3 text-sm text-muted">
                  {oauthCallbackUrl(provider.id)}
                </code>
              </div>
              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted">
                <input name="clearSecret" type="checkbox" />
                Clear stored secret
              </label>
              <button className="btn-primary" type="submit">
                Save {provider.name}
              </button>
            </form>
          </section>
        ))}
      </div>
    </AdminShell>
  );
}
