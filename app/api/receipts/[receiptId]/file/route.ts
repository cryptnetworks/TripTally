import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { resolveReceiptPathInsideUploadDir } from "@/lib/receipts/storage";
import { requireUser } from "@/lib/session";
import { resolveTripAccess } from "@/lib/trip-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ receiptId: string }> }
) {
  const user = await requireUser();
  const { receiptId } = await params;
  const receipt = await prisma.receipt.findUnique({ where: { id: receiptId } });
  if (!receipt) return apiError("NOT_FOUND", 404);

  const access = await resolveTripAccess(receipt.tripId, user.id);
  if (!access) return apiError("NOT_FOUND", 404);

  let resolvedPath: string;
  let fileStat: Awaited<ReturnType<typeof stat>>;
  try {
    resolvedPath = resolveReceiptPathInsideUploadDir(receipt.storedPath);
    fileStat = await stat(resolvedPath);
  } catch {
    return apiError("NOT_FOUND", 404);
  }

  const stream = createReadStream(resolvedPath);
  return new Response(stream as unknown as BodyInit, {
    headers: {
      "content-type": receipt.mimeType,
      "content-length": String(fileStat.size),
      "content-disposition": `inline; filename="${receipt.storedFilename}"`,
      "x-content-type-options": "nosniff"
    }
  });
}
