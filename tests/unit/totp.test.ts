import { describe, expect, it } from "vitest";
import {
  buildAuthenticatorUri,
  generateAuthenticatorSecret,
  generateTotpCode,
  verifyTotpCode
} from "@/lib/totp";

describe("authenticator TOTP", () => {
  it("generates base32 secrets for authenticator apps", () => {
    const secret = generateAuthenticatorSecret();

    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(secret.length).toBeGreaterThanOrEqual(32);
  });

  it("verifies generated six-digit codes", () => {
    const secret = "JBSWY3DPEHPK3PXP";
    const time = Date.UTC(2026, 4, 28, 12, 0, 0);
    const code = generateTotpCode(secret, time);

    expect(code).toMatch(/^\d{6}$/);
    expect(verifyTotpCode(secret, code, time)).toBe(true);
    expect(verifyTotpCode(secret, "000000", time)).toBe(false);
  });

  it("builds otpauth URIs with issuer and account labels", () => {
    const uri = buildAuthenticatorUri({
      appName: "Trip Tally",
      email: "user@example.com",
      secret: "JBSWY3DPEHPK3PXP"
    });

    expect(uri).toContain("otpauth://totp/Trip%20Tally%3Auser%40example.com");
    expect(uri).toContain("issuer=Trip%20Tally");
    expect(uri).toContain("secret=JBSWY3DPEHPK3PXP");
  });
});
