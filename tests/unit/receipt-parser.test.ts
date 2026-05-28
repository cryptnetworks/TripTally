import { describe, expect, it } from "vitest";
import { LocalHeuristicReceiptParser } from "@/lib/receipts/parser";

describe("local receipt parser", () => {
  it("extracts common receipt fields from text-like files", async () => {
    const parser = new LocalHeuristicReceiptParser();
    const parsed = await parser.parse({
      filename: "receipt.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(
        "Cafe Example\n05/28/2026\nBagel 4.50\nCoffee 3.25\nSubtotal 7.75\nTax 0.62\nTip 1.00\nTotal 9.37"
      )
    });

    expect(parsed.merchant).toContain("Cafe Example");
    expect(parsed.subtotal).toBe(7.75);
    expect(parsed.tax).toBe(0.62);
    expect(parsed.tip).toBe(1);
    expect(parsed.total).toBe(9.37);
    expect(parsed.lineItems).toEqual([
      expect.objectContaining({ name: "Bagel", totalPrice: 4.5 }),
      expect.objectContaining({ name: "Coffee", totalPrice: 3.25 })
    ]);
  });

  it("falls back safely when image OCR is unavailable", async () => {
    const parser = new LocalHeuristicReceiptParser();
    const parsed = await parser.parse({
      filename: "receipt.png",
      mimeType: "image/png",
      buffer: Buffer.from("image bytes")
    });

    expect(parsed.rawText).toBe("");
    expect(parsed.confidence).toBe(0);
    expect(parsed.lineItems).toEqual([]);
  });
});
