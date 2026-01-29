import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/auth/check-password
 * Check if a teacher has set a password (determines signin flow)
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { email } = data;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email required" },
        { status: 400 }
      );
    }

    // Check Teacher table for PE teachers
    const teacher = await prisma.teacher.findUnique({
      where: { email },
      select: { password: true },
    });

    if (teacher) {
      return NextResponse.json({
        success: true,
        hasPassword: !!teacher.password,
      });
    }

    // Fallback to User table for regular users
    const user = await prisma.user.findUnique({
      where: { email },
      select: { password: true },
    });

    return NextResponse.json({
      success: true,
      hasPassword: user ? !!user.password : false,
    });
  } catch (error) {
    console.error("Check password error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
