import { createPublicKey, verify } from "node:crypto";

const ed25519SpkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
const maxDiscordSignatureAgeMs = 5 * 60 * 1000;

function hasFreshTimestamp(timestamp: string) {
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds)) return false;
  return Math.abs(Date.now() - seconds * 1000) <= maxDiscordSignatureAgeMs;
}

export function verifyDiscordRequest({
  body,
  signature,
  timestamp,
  publicKey
}: {
  body: string;
  signature: string | null;
  timestamp: string | null;
  publicKey?: string;
}) {
  if (!signature || !timestamp || !publicKey) return false;
  if (!hasFreshTimestamp(timestamp)) return false;
  try {
    const key = createPublicKey({
      key: Buffer.concat([ed25519SpkiPrefix, Buffer.from(publicKey, "hex")]),
      format: "der",
      type: "spki"
    });
    return verify(null, Buffer.from(`${timestamp}${body}`), key, Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}
