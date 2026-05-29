import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";

function testOAuthEnabled() {
  return (
    process.env.NODE_ENV !== "production" && process.env.TEST_OAUTH_PROVIDER_ENABLED === "true"
  );
}

export async function POST(request: Request) {
  if (!testOAuthEnabled()) {
    return apiError("NOT_FOUND", 404);
  }

  const body = await request.formData();
  if (body.get("code") !== "test-oauth-code") {
    return apiError("BAD_REQUEST", 400);
  }

  return NextResponse.json({
    access_token: "test-oauth-access-token",
    token_type: "Bearer"
  });
}
