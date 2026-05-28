import { afterEach, describe, expect, it } from "vitest";
import { publicBaseUrl, publicUrl } from "@/lib/url";

const originalPublicAppUrl = process.env.PUBLIC_APP_URL;
const originalNextAuthUrl = process.env.NEXTAUTH_URL;

afterEach(() => {
  process.env.PUBLIC_APP_URL = originalPublicAppUrl;
  process.env.NEXTAUTH_URL = originalNextAuthUrl;
});

describe("public URLs", () => {
  it("uses forwarded headers when the configured URL is an internal bind address", () => {
    process.env.PUBLIC_APP_URL = "";
    process.env.NEXTAUTH_URL = "https://0.0.0.0:3000";

    const request = new Request("https://0.0.0.0:3000/api/auth/oauth/google/callback", {
      headers: {
        "x-forwarded-host": "triptally.idiots.cc",
        "x-forwarded-proto": "https"
      }
    });

    expect(publicBaseUrl(request)).toBe("https://triptally.idiots.cc");
    expect(publicUrl("/login?oauthToken=test", request).toString()).toBe(
      "https://triptally.idiots.cc/login?oauthToken=test"
    );
  });

  it("prefers PUBLIC_APP_URL when it is configured", () => {
    process.env.PUBLIC_APP_URL = "https://app.example.com";
    process.env.NEXTAUTH_URL = "https://0.0.0.0:3000";

    expect(publicBaseUrl()).toBe("https://app.example.com");
  });
});
