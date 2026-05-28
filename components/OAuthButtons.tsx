import Link from "next/link";
import { enabledLoginProviders } from "@/lib/oauth-providers";

export async function OAuthButtons() {
  const providers = await enabledLoginProviders();
  if (providers.length === 0) return null;

  return (
    <div className="mt-6 grid gap-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs font-semibold uppercase text-muted">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      {providers.map((provider) => (
        <Link
          key={provider.id}
          className="btn-secondary w-full"
          href={`/api/auth/oauth/${provider.id}/start`}
        >
          Continue with {provider.name}
        </Link>
      ))}
    </div>
  );
}
