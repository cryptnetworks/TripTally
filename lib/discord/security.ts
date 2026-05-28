import { createPublicKey, verify } from "node:crypto";

const ed25519SpkiPrefix = Buffer.from("302a300506032b6570032100", "hex");

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
  const key = createPublicKey({
    key: Buffer.concat([ed25519SpkiPrefix, Buffer.from(publicKey, "hex")]),
    format: "der",
    type: "spki"
  });
  return verify(null, Buffer.from(`${timestamp}${body}`), key, Buffer.from(signature, "hex"));
}
