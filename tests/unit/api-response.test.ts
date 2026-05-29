import { describe, expect, it } from "vitest";
import { apiError } from "@/lib/api-response";

describe("api responses", () => {
  it("returns a consistent safe error shape", async () => {
    const response = apiError("FORBIDDEN", 403);
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual({
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "You do not have permission to do that."
      }
    });
  });
});
