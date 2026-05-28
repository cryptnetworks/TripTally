import { describe, expect, it } from "vitest";
import {
  calculateBalances,
  calculateEqualShares,
  generateSettlementSuggestions
} from "@/lib/calculations";
import { testExpense, testParticipant } from "@/tests/fixtures/triptally";

describe("calculateEqualShares", () => {
  it("splits cents without losing or creating money", () => {
    const shares = calculateEqualShares(100, 3);

    expect(shares).toEqual([33.34, 33.33, 33.33]);
    expect(shares.reduce((sum, share) => sum + share, 0)).toBeCloseTo(100, 2);
  });

  it("returns no shares for an empty participant set", () => {
    expect(calculateEqualShares(42, 0)).toEqual([]);
  });
});

describe("calculateBalances", () => {
  it("calculates paid, owed, net, and settlements", () => {
    const alice = testParticipant("alice", "Alice");
    const bob = testParticipant("bob", "Bob");
    const claire = testParticipant("claire", "Claire");

    const result = calculateBalances(
      [alice, bob, claire],
      [
        testExpense({
          id: "rental",
          amount: 90,
          payerId: alice.id,
          shares: [
            { participantId: alice.id, shareAmount: 30 },
            { participantId: bob.id, shareAmount: 30 },
            { participantId: claire.id, shareAmount: 30 }
          ]
        }),
        testExpense({
          id: "dinner",
          amount: 60,
          payerId: bob.id,
          shares: [
            { participantId: alice.id, shareAmount: 30 },
            { participantId: bob.id, shareAmount: 30 }
          ]
        })
      ]
    );

    expect(result.balances).toEqual([
      expect.objectContaining({ participant: alice, paid: 90, owed: 60, net: 30 }),
      expect.objectContaining({ participant: bob, paid: 60, owed: 60, net: 0 }),
      expect.objectContaining({ participant: claire, paid: 0, owed: 30, net: -30 })
    ]);
    expect(result.settlements).toEqual([
      expect.objectContaining({
        debtorName: "Claire",
        creditorName: "Alice",
        amount: 30,
        label: "Claire owes Alice $30.00"
      })
    ]);
  });

  it("falls back to equal split when an expense has no stored shares", () => {
    const alice = testParticipant("alice", "Alice");
    const bob = testParticipant("bob", "Bob");

    const result = calculateBalances(
      [alice, bob],
      [testExpense({ id: "taxi", amount: 25, payerId: alice.id, shares: [] })]
    );

    expect(result.balances).toEqual([
      expect.objectContaining({ participant: alice, paid: 25, owed: 12.5, net: 12.5 }),
      expect.objectContaining({ participant: bob, paid: 0, owed: 12.5, net: -12.5 })
    ]);
  });
});

describe("generateSettlementSuggestions", () => {
  it("minimizes multi-person debt settlement", () => {
    const alice = testParticipant("alice", "Alice");
    const bob = testParticipant("bob", "Bob");
    const claire = testParticipant("claire", "Claire");
    const drew = testParticipant("drew", "Drew");

    const settlements = generateSettlementSuggestions([
      { participant: alice, paid: 0, owed: 0, net: 50 },
      { participant: bob, paid: 0, owed: 0, net: 20 },
      { participant: claire, paid: 0, owed: 0, net: -40 },
      { participant: drew, paid: 0, owed: 0, net: -30 }
    ]);

    expect(settlements.map((settlement) => settlement.label)).toEqual([
      "Claire owes Alice $40.00",
      "Drew owes Alice $10.00",
      "Drew owes Bob $20.00"
    ]);
  });
});
