import crypto from "crypto";

const DEVELOPMENT_TOKEN_DIGEST_KEY = "triptally-development-token-digest-key";

function tokenDigestKey() {
  const key = process.env.AUTH_CONFIG_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (key) return key;

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET or AUTH_CONFIG_ENCRYPTION_KEY is required for token digests.");
  }

  return DEVELOPMENT_TOKEN_DIGEST_KEY;
}

export function digestLookupToken(token: string) {
  return crypto.createHmac("sha256", tokenDigestKey()).update(token).digest("hex");
}
