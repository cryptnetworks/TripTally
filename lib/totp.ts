import crypto from "crypto";

const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Buffer) {
  let bits = "";
  let output = "";

  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, "0");
  }

  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5).padEnd(5, "0");
    output += base32Alphabet[Number.parseInt(chunk, 2)];
  }

  return output;
}

function base32Decode(value: string) {
  const cleanValue = value.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  let bits = "";

  for (const char of cleanValue) {
    const index = base32Alphabet.indexOf(char);
    if (index === -1) {
      throw new Error("Invalid base32 character.");
    }
    bits += index.toString(2).padStart(5, "0");
  }

  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
}

function timingSafeEqualString(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function generateAuthenticatorSecret() {
  return base32Encode(crypto.randomBytes(20));
}

export function generateTotpCode(secret: string, time = Date.now()) {
  const counter = Math.floor(time / 1000 / 30);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", base32Decode(secret)).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binary % 1_000_000).padStart(6, "0");
}

export function verifyTotpCode(secret: string, code: string, time = Date.now()) {
  const normalizedCode = code.trim().replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalizedCode)) {
    return false;
  }

  return [-1, 0, 1].some((windowOffset) =>
    timingSafeEqualString(normalizedCode, generateTotpCode(secret, time + windowOffset * 30_000))
  );
}

export function buildAuthenticatorUri(input: { appName: string; email: string; secret: string }) {
  const label = encodeURIComponent(`${input.appName}:${input.email}`);
  const issuer = encodeURIComponent(input.appName);
  return `otpauth://totp/${label}?secret=${input.secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}
