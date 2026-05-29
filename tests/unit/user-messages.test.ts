import { describe, expect, it } from "vitest";
import {
  formatActivityMessage,
  normalizeApiError,
  queryFeedback,
  safeApiErrorMessage
} from "@/lib/user-messages";

describe("user-facing messages", () => {
  it("maps known API errors to safe copy", () => {
    expect(safeApiErrorMessage("UNAUTHORIZED")).toBe("Please sign in to continue.");
    expect(safeApiErrorMessage("PrismaClientKnownRequestError")).toBe(
      "Something went wrong. Please try again."
    );
  });

  it("normalizes unknown backend errors without exposing technical details", () => {
    expect(normalizeApiError(new Error("SQLITE_CONSTRAINT"))).toEqual({
      code: "UNKNOWN",
      message: "Something went wrong. Please try again."
    });
  });

  it("formats redirect query codes as readable feedback", () => {
    expect(queryFeedback("receipt", "too_large")).toEqual({
      tone: "error",
      message: "That receipt file is too large."
    });
  });

  it("formats audit actions as natural language", () => {
    expect(
      formatActivityMessage({
        action: "expense.create",
        actor: { username: "Mike" },
        afterJson: JSON.stringify({ title: "Dinner" })
      })
    ).toBe("Mike added an expense for Dinner.");
  });

  it("uses readable fallbacks for missing activity context", () => {
    expect(formatActivityMessage({ action: "expense.delete" })).toBe("Someone deleted an expense.");
  });
});
