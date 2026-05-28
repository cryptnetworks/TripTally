import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyDiscordRequest } from "@/lib/discord/security";

function createSignedDiscordRequest(timestamp: string, body: string) {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyDer = publicKey.export({ format: "der", type: "spki" }) as Buffer;
  const rawPublicKey = publicKeyDer.subarray(-32).toString("hex");
  const signature = sign(null, Buffer.from(`${timestamp}${body}`), privateKey).toString("hex");
  return { rawPublicKey, signature };
}

describe("Discord request verification", () => {
  it("accepts a valid signature with a fresh timestamp", () => {
    const body = JSON.stringify({ type: 1 });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const { rawPublicKey, signature } = createSignedDiscordRequest(timestamp, body);

    expect(
      verifyDiscordRequest({
        body,
        signature,
        timestamp,
        publicKey: rawPublicKey
      })
    ).toBe(true);
  });

  it("rejects stale signed requests", () => {
    const body = JSON.stringify({ type: 1 });
    const timestamp = String(Math.floor(Date.now() / 1000) - 600);
    const { rawPublicKey, signature } = createSignedDiscordRequest(timestamp, body);

    expect(
      verifyDiscordRequest({
        body,
        signature,
        timestamp,
        publicKey: rawPublicKey
      })
    ).toBe(false);
  });

  it("rejects invalid signatures", () => {
    const body = JSON.stringify({ type: 1 });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const { rawPublicKey } = createSignedDiscordRequest(timestamp, body);

    expect(
      verifyDiscordRequest({
        body,
        signature: "00",
        timestamp,
        publicKey: rawPublicKey
      })
    ).toBe(false);
  });
});
