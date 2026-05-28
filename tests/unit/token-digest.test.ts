import { afterEach, describe, expect, it, vi } from "vitest";
import { digestLookupToken } from "@/lib/token-digest";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("lookup token digests", () => {
  it("creates stable keyed digests for one-time tokens", () => {
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret-one");
    vi.stubEnv("AUTH_CONFIG_ENCRYPTION_KEY", "");

    const digest = digestLookupToken("opaque-token");

    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(digest).toBe(digestLookupToken("opaque-token"));
    expect(digest).not.toBe(digestLookupToken("other-token"));
  });

  it("changes digests when the application key changes", () => {
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret-one");
    vi.stubEnv("AUTH_CONFIG_ENCRYPTION_KEY", "");
    const firstDigest = digestLookupToken("opaque-token");

    vi.stubEnv("NEXTAUTH_SECRET", "test-secret-two");

    expect(digestLookupToken("opaque-token")).not.toBe(firstDigest);
  });

  it("requires an application key in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXTAUTH_SECRET", "");
    vi.stubEnv("AUTH_CONFIG_ENCRYPTION_KEY", "");

    expect(() => digestLookupToken("opaque-token")).toThrow(
      "NEXTAUTH_SECRET or AUTH_CONFIG_ENCRYPTION_KEY is required for token digests."
    );
  });
});
