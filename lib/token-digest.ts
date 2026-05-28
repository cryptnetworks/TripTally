import crypto from "crypto";

const TEST_TOKEN_DIGEST_SECRET = "triptally-test-token-digest-secret";
const TOKEN_DIGEST_HEX_LENGTH = 64;

function tokenDigestSecret() {
  const secret = process.env.TOKEN_DIGEST_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "test") {
    return TEST_TOKEN_DIGEST_SECRET;
  }

  throw new Error("TOKEN_DIGEST_SECRET is required for token digests.");
}

export function digestLookupToken(token: string) {
  // This stores high-entropy random one-time lookup tokens as keyed HMAC digests.
  // User passwords still use bcrypt; these tokens are not user-memorable secrets.
  // codeql[js/insufficient-password-hash]
  return crypto.createHmac("sha256", tokenDigestSecret()).update(token).digest("hex");
}

export function timingSafeEqualTokenDigest(token: string, expectedDigest: string) {
  if (!/^[a-f0-9]{64}$/i.test(expectedDigest)) return false;

  const actual = Buffer.from(digestLookupToken(token), "hex");
  const expected = Buffer.from(expectedDigest, "hex");

  if (actual.length !== TOKEN_DIGEST_HEX_LENGTH / 2 || expected.length !== actual.length) {
    return false;
  }

  return crypto.timingSafeEqual(actual, expected);
}
