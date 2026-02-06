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

  // Protect /teacher routes
  if (pathname.startsWith("/teacher")) {
    const teacherSession = request.cookies.get("teacher_session");
    const tempEmail = request.cookies.get("temp_teacher_email");

    // If no session and no temp setup cookie, redirect to signin
    if (!teacherSession && !tempEmail) {
      return NextResponse.redirect(new URL("/auth/teacher-signin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*"],
};
