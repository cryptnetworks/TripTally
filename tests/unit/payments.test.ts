import { describe, expect, it } from "vitest";
import { paymentMethodSchema, paymentProviderLabel } from "@/lib/payments";

describe("payment methods", () => {
  it("accepts safe external payment links", () => {
    const parsed = paymentMethodSchema.safeParse({
      provider: "venmo",
      handle: "@sarah",
      url: "https://venmo.com/sarah",
      visibility: "trip_members",
      enabled: true
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects unsafe payment URLs", () => {
    const parsed = paymentMethodSchema.safeParse({
      provider: "custom",
      url: "javascript:alert(1)",
      visibility: "trip_members",
      enabled: true
    });

    expect(parsed.success).toBe(false);
  });

  it("labels supported providers", () => {
    expect(paymentProviderLabel("paypal")).toBe("PayPal");
    expect(paymentProviderLabel("custom")).toBe("Payment link");
  });
});
