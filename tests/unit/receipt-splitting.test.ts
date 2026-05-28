import { describe, expect, it } from "vitest";
import { calculateReceiptItemizedShares } from "@/lib/receipts/splitting";

describe("itemized receipt splitting", () => {
  it("excludes participants from individual items and allocates tax/tip proportionally", () => {
    const shares = calculateReceiptItemizedShares({
      participantIds: ["alice", "bob", "chris"],
      tax: 3,
      tip: 6,
      lineItems: [
        {
          id: "pizza",
          totalPrice: 30,
          assignedParticipantIds: ["alice", "bob", "chris"],
          excludedParticipantIds: ["chris"]
        },
        {
          id: "salad",
          totalPrice: 15,
          assignedParticipantIds: ["alice", "bob", "chris"],
          excludedParticipantIds: ["bob"]
        }
      ]
    });

    expect(shares).toEqual({
      alice: 27,
      bob: 18,
      chris: 9
    });
  });
});
