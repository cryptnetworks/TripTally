import { NextResponse } from "next/server";

type ApiMeta = Record<string, string | number | boolean | null>;

export function ok<T>(data: T, meta: ApiMeta = {}) {
  return NextResponse.json({
    ok: true,
    data,
    ...meta
  });
}

export function unavailable(message = "Service unavailable") {
  return NextResponse.json(
    {
      ok: false,
      error: {
        message
      }
    },
    { status: 503 }
  );
}
