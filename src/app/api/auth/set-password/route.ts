import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

// Set password for a user after initial activation code login
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { password } = data;

    if (!password) {
      return NextResponse.json(
        { success: false, message: "Password required" },
        { status: 400 }
      );
    }

    // Get user from session cookie
    const sessionId = request.cookies.get("teacher_session")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Update user with password
    const user = await prisma.user.update({
      where: { id: sessionId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Password set successfully",
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Set password error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
