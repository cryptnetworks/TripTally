import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      service: "triptally",
      time: new Date().toISOString()
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "healthcheck.failed",
        time: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error"
      })
    );

    return NextResponse.json(
      {
        ok: false,
        service: "triptally"
      },
      { status: 503 }
    );
  }
}
