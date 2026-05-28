import { describe, expect, it } from "vitest";
import { bootstrapRole } from "@/lib/roles";
import { emailDomainAllowed } from "@/lib/settings";

describe("admin bootstrap and auth policy", () => {
  it("promotes the first registered user to admin", () => {
    expect(bootstrapRole(0, "user")).toBe("admin");
    expect(bootstrapRole(1, "user")).toBe("user");
    expect(bootstrapRole(2, "readonly")).toBe("readonly");
  });

  it("validates allowed email domains", () => {
    expect(emailDomainAllowed("user@example.com", [])).toBe(true);
    expect(emailDomainAllowed("user@example.com", ["example.com"])).toBe(true);
    expect(emailDomainAllowed("user@other.com", ["example.com"])).toBe(false);
  });
});
