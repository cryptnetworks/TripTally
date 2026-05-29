import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";

function testOAuthEnabled() {
  return (
    process.env.NODE_ENV !== "production" && process.env.TEST_OAUTH_PROVIDER_ENABLED === "true"
  );
}

export async function GET(request: Request) {
  if (!testOAuthEnabled()) {
    return apiError("NOT_FOUND", 404);
  }

  const url = new URL(request.url);
  const redirectUri = url.searchParams.get("redirect_uri");
  const state = url.searchParams.get("state");
  if (!redirectUri || !state) {
    return apiError("BAD_REQUEST", 400);
  }

  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set("code", "test-oauth-code");
  callbackUrl.searchParams.set("state", state);
  return NextResponse.redirect(callbackUrl);
}
