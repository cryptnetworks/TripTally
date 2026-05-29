import { NextResponse } from "next/server";
import { normalizeApiError, type SafeApiErrorCode } from "@/lib/user-messages";

type ApiMeta = Record<string, string | number | boolean | null>;

export function ok<T>(data: T, meta: ApiMeta = {}) {
  return NextResponse.json({
    ok: true,
    data,
    ...meta
  });
}

export function apiError(code: SafeApiErrorCode, status = 400, meta: ApiMeta = {}) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        ...normalizeApiError(code),
        ...meta
      }
    },
    { status }
  );
}

export function unavailable(message?: string) {
  const error = normalizeApiError("SERVICE_UNAVAILABLE");
  return NextResponse.json(
    {
      ok: false,
      error: {
        ...error,
        message: message || error.message
      }
    },
    { status: 503 }
  );
}
