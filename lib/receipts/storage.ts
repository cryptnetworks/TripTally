import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { getAppConfig } from "@/lib/config";

export const allowedReceiptMimeTypes = new Map([
  ["application/pdf", "pdf"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/heic", "heic"],
  ["image/heif", "heic"]
]);

export function receiptUploadConfig() {
  const config = getAppConfig();
  return {
    uploadDir: path.resolve(config.receiptUploadDir),
    maxBytes: Math.round(config.maxReceiptUploadMb * 1024 * 1024)
  };
}

export function validateReceiptFile(file: File) {
  const config = receiptUploadConfig();
  if (file.size <= 0) return { ok: false as const, error: "empty" };
  if (file.size > config.maxBytes) return { ok: false as const, error: "too_large" };
  const extension = allowedReceiptMimeTypes.get(file.type);
  if (!extension) return { ok: false as const, error: "type" };
  return { ok: true as const, extension };
}

export function safeOriginalFilename(name: string) {
  const basename = path
    .basename(name)
    .replaceAll(/[^\w.\- ]/g, "_")
    .trim();
  return basename || "receipt";
}

function safePathSegment(value: string) {
  return value.replaceAll(/[^\w.-]/g, "_");
}

export function resolveReceiptPathInsideUploadDir(storedPath: string) {
  const config = receiptUploadConfig();
  const uploadDir = path.resolve(config.uploadDir);
  const resolvedPath = path.resolve(storedPath);
  const relativePath = path.relative(uploadDir, resolvedPath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Resolved receipt path escaped upload directory.");
  }
  return resolvedPath;
}

export async function storeReceiptFile({
  tripId,
  receiptId,
  file,
  extension
}: {
  tripId: string;
  receiptId: string;
  file: File;
  extension: string;
}) {
  const config = receiptUploadConfig();
  const receiptDir = path.join(
    config.uploadDir,
    safePathSegment(tripId),
    safePathSegment(receiptId)
  );
  const storedFilename = `original.${extension}`;
  const storedPath = resolveReceiptPathInsideUploadDir(path.join(receiptDir, storedFilename));

  await mkdir(receiptDir, { recursive: true });
  await writeFile(storedPath, Buffer.from(await file.arrayBuffer()));
  return { storedFilename, storedPath };
}
