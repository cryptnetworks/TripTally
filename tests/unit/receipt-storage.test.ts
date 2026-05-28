import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveReceiptPathInsideUploadDir } from "@/lib/receipts/storage";

const originalEnv = { ...process.env };

function setRequiredConfig(uploadDir: string) {
  process.env["DATABASE_URL"] = "file:./test.db";
  process.env["NEXTAUTH_URL"] = "http://localhost:3000";
  process.env["TOKEN_DIGEST_SECRET"] = "test-token-digest-secret-with-length";
  process.env["RECEIPT_UPLOAD_DIR"] = uploadDir;
}

describe("receipt storage paths", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("allows paths inside the configured upload directory", () => {
    const uploadDir = path.resolve("/tmp/triptally-receipts");
    setRequiredConfig(uploadDir);

    expect(
      resolveReceiptPathInsideUploadDir(path.join(uploadDir, "trip", "receipt", "original.pdf"))
    ).toBe(path.join(uploadDir, "trip", "receipt", "original.pdf"));
  });

  it("rejects paths outside the configured upload directory", () => {
    const uploadDir = path.resolve("/tmp/triptally-receipts");
    setRequiredConfig(uploadDir);

    expect(() =>
      resolveReceiptPathInsideUploadDir("/tmp/triptally-receipts-evil/file.pdf")
    ).toThrow("escaped upload directory");
  });
});
