import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("security headers", () => {
  it("configures the expected production security headers", () => {
    const config = readFileSync("next.config.mjs", "utf8");

    expect(config).toContain("Content-Security-Policy");
    expect(config).toContain("default-src 'self'");
    expect(config).toContain("frame-ancestors 'none'");
    expect(config).toContain("Strict-Transport-Security");
    expect(config).toContain("max-age=31536000");
    expect(config).toContain("X-Frame-Options");
    expect(config).toContain("DENY");
    expect(config).toContain("X-Content-Type-Options");
    expect(config).toContain("nosniff");
    expect(config).toContain("Referrer-Policy");
    expect(config).toContain("strict-origin-when-cross-origin");
    expect(config).toContain("Cross-Origin-Opener-Policy");
    expect(config).toContain("same-origin");
  });
});
