import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, getAdminCredentials } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const { username: envUsername, passwordHash, passwordInput } = getAdminCredentials();

    // Validate username
    if (username !== envUsername) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Validate password
    let isValid = false;
    if (passwordHash) {
      isValid = await verifyPassword(password, passwordHash);
    } else if (passwordInput) {
      isValid = password === passwordInput;
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Set admin session cookie
    const response = NextResponse.json({
      success: true,
      message: "Admin login successful",
    });

    response.cookies.set("admin_session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
