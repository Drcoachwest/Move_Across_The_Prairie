import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.redirect(new URL("/", request.nextUrl.origin));

    response.cookies.set("teacher_session", "", {
      httpOnly: true,
      maxAge: 0,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
