import { NextResponse } from "next/server";

function testOAuthEnabled() {
  return (
    process.env.NODE_ENV !== "production" && process.env.TEST_OAUTH_PROVIDER_ENABLED === "true"
  );
}

export async function POST(request: Request) {
  if (!testOAuthEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.formData();
  if (body.get("code") !== "test-oauth-code") {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  return NextResponse.json({
    access_token: "test-oauth-access-token",
    token_type: "Bearer"
  });
}
