import { ok, unavailable } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({ service: "seddleup" }, { time: new Date().toISOString() });
  } catch (error) {
    logger.error("healthcheck.failed", {
      error: error instanceof Error ? error.message : "Unknown error"
    });

    return unavailable("Database connectivity check failed");
  }
}
