import { describe, expect, it } from "vitest";
import { createLookupProvider } from "@/lib/item-lookup/providers";

describe("item lookup providers", () => {
  it("returns mock provider results for development", async () => {
    const provider = createLookupProvider("mock");
    const results = await provider.searchItems("paper towels");

    expect(results[0]).toEqual(
      expect.objectContaining({
        provider: "mock",
        title: "paper towels",
        retailer: "Mock Retailer"
      })
    );
  });

  it("keeps real providers disabled until credentials are implemented", async () => {
    const provider = createLookupProvider("amazon");
    await expect(provider.searchItems("paper towels")).resolves.toEqual([]);
  });
});
