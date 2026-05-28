import { prisma } from "@/lib/prisma";

export type AuthSettings = {
  localAuthEnabled: boolean;
  publicRegistrationEnabled: boolean;
  requireEmailVerification: boolean;
  allowedEmailDomains: string[];
  defaultUserRole: "user" | "readonly";
};

const defaultSettings: AuthSettings = {
  localAuthEnabled: true,
  publicRegistrationEnabled: true,
  requireEmailVerification: true,
  allowedEmailDomains: [],
  defaultUserRole: "user"
};

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

export async function getAuthSettings(): Promise<AuthSettings> {
  const settings = await prisma.appSetting.findMany();
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));

  return {
    localAuthEnabled: parseBoolean(map.get("localAuthEnabled"), defaultSettings.localAuthEnabled),
    publicRegistrationEnabled: parseBoolean(
      map.get("publicRegistrationEnabled"),
      defaultSettings.publicRegistrationEnabled
    ),
    requireEmailVerification: parseBoolean(
      map.get("requireEmailVerification"),
      defaultSettings.requireEmailVerification
    ),
    allowedEmailDomains: (map.get("allowedEmailDomains") || "")
      .split(",")
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean),
    defaultUserRole: map.get("defaultUserRole") === "readonly" ? "readonly" : "user"
  };
}

export async function setAuthSettings(settings: AuthSettings) {
  const entries = {
    localAuthEnabled: String(settings.localAuthEnabled),
    publicRegistrationEnabled: String(settings.publicRegistrationEnabled),
    requireEmailVerification: String(settings.requireEmailVerification),
    allowedEmailDomains: settings.allowedEmailDomains.join(","),
    defaultUserRole: settings.defaultUserRole
  };

  await prisma.$transaction(
    Object.entries(entries).map(([key, value]) =>
      prisma.appSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value }
      })
    )
  );
}

export function emailDomainAllowed(email: string, allowedDomains: string[]) {
  if (allowedDomains.length === 0) return true;
  const domain = email.split("@")[1]?.toLowerCase();
  return Boolean(domain && allowedDomains.includes(domain));
}
