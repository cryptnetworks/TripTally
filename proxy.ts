import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse, type NextFetchEvent } from "next/server";

const authProxy = withAuth(function middleware() {
  return NextResponse.next();
});

export function proxy(request: NextRequestWithAuth, event: NextFetchEvent) {
  return authProxy(request, event);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/dashboard/:path*", "/trips/:path*"]
};
