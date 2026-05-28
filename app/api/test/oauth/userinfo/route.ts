import { NextResponse } from "next/server";

function testOAuthEnabled() {
  return (
    process.env.NODE_ENV !== "production" && process.env.TEST_OAUTH_PROVIDER_ENABLED === "true"
  );
}

export async function GET(request: Request) {
  if (!testOAuthEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const authorization = request.headers.get("authorization");
  if (authorization !== "Bearer test-oauth-access-token") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = process.env.TEST_OAUTH_EMAIL || "sso-user@triptally.test";
  const name = process.env.TEST_OAUTH_NAME || "SSO User";
  return NextResponse.json({
    sub: "test-oauth-user",
    id: "test-oauth-user",
    email,
    email_verified: true,
    name
  });
}
