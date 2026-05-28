import { afterEach, describe, expect, it, vi } from "vitest";
import { digestLookupToken, timingSafeEqualTokenDigest } from "@/lib/token-digest";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("lookup token digests", () => {
  it("creates stable keyed digests for one-time tokens", () => {
    vi.stubEnv("TOKEN_DIGEST_SECRET", "test-secret-one");

    const digest = digestLookupToken("opaque-token");

    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(digest).toBe(digestLookupToken("opaque-token"));
    expect(digest).not.toBe(digestLookupToken("other-token"));
  });

  it("changes digests when the application key changes", () => {
    vi.stubEnv("TOKEN_DIGEST_SECRET", "test-secret-one");
    const firstDigest = digestLookupToken("opaque-token");

    vi.stubEnv("TOKEN_DIGEST_SECRET", "test-secret-two");

    expect(digestLookupToken("opaque-token")).not.toBe(firstDigest);
  });

  it("requires a dedicated application key outside tests", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TOKEN_DIGEST_SECRET", "");

    expect(() => digestLookupToken("opaque-token")).toThrow(
      "TOKEN_DIGEST_SECRET is required for token digests."
    );
  });

  it("compares token digests using a timing-safe comparison", () => {
    vi.stubEnv("TOKEN_DIGEST_SECRET", "test-secret-one");
    const digest = digestLookupToken("opaque-token");

    expect(timingSafeEqualTokenDigest("opaque-token", digest)).toBe(true);
    expect(timingSafeEqualTokenDigest("wrong-token", digest)).toBe(false);
    expect(timingSafeEqualTokenDigest("opaque-token", "not-a-valid-digest")).toBe(false);
  });
});
