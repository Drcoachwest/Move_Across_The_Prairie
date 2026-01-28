import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    const adminSession = request.cookies.get("admin_session");

    if (!adminSession) {
      return NextResponse.redirect(new URL("/auth/admin-login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
